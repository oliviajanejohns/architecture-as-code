package org.finos.calm.store.mongo;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.finos.calm.store.CoreSchemaStore;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
@Typed(MongoCoreSchemaStore.class)
public class MongoCoreSchemaStore implements CoreSchemaStore {

    private final MongoCollection<Document> schemaCollection;

    public MongoCoreSchemaStore(MongoClient mongoClient) {
        MongoDatabase database = mongoClient.getDatabase("calmSchemas");
        this.schemaCollection = database.getCollection("schemas");
    }

    @Override
    public List<String> getVersions() {
        List<String> versions = new ArrayList<>();
        for (Document doc : schemaCollection.find()) {
            versions.add(doc.getString("version"));
        }
        return versions;
    }

    @Override
    public Map<String, Object> getSchemasForVersion(String version) {
        Bson filter = Filters.eq("version", version);
        Document document = schemaCollection.find(filter).first();

        if (document != null) {
            return document.get("schemas", Map.class);  // Get the 'schemas' field as a map
        }

        return null;
    }

    @Override
    public void createSchemaVersion(String version, Map<String, Object> schemas) {
        // Check if version already exists
        Bson filter = Filters.eq("version", version);
        Document existingDoc = schemaCollection.find(filter).first();
        
        if (existingDoc == null) {
            Document schemaDoc = new Document()
                    .append("version", version)
                    .append("schemas", schemas);
            schemaCollection.insertOne(schemaDoc);
        }
    }
}
