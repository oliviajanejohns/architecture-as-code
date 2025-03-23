import './cytoscape.css';
import { useContext, useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape';
import nodeEdgeHtmlLabel from 'cytoscape-node-edge-html-label';
import expandCollapse from 'cytoscape-expand-collapse';
import Sidebar from '../sidebar/Sidebar.js';
import { ZoomContext } from '../zoom-context.provider.js';

//Make some information available on tooltip hover

nodeEdgeHtmlLabel(cytoscape);
expandCollapse(cytoscape);

const breadthFirstLayout = {
    name: 'breadthfirst',
    fit: true,
    directed: true,
    circle: false,
    grid: true,
    avoidOverlap: true,
    padding: 30,
    spacingFactor: 1.25,
};

export type Node = {
    classes?: string;
    data: {
        description: string;
        type: string;
        label: string;
        id: string;
        [idx: string]: string;
    };
};

export type Edge = {
    data: {
        id: string;
        label: string;
        source: string;
        target: string;
        [idx: string]: string;
    };
};

interface Props {
    title?: string;
    isNodeDescActive: boolean;
    isConDescActive: boolean;
    nodes: Node[];
    edges: Edge[];
}

const CytoscapeRenderer = ({
    title,
    nodes = [],
    edges = [],
    isConDescActive,
    isNodeDescActive,
}: Props) => {
    function zoomIn() {
        //Obtain percentage as integer
        const currentPercentageZoom = Math.round(zoomLevel * 100);
        //Add 10% to the zoom or round to upper 10% interval
        const newPercentageZoom = Math.floor(currentPercentageZoom / 10) * 10 + 10;
        updateZoom(newPercentageZoom / 100);
    }

    function zoomOut() {
        //Obtain percentage as integer
        const currentPercentageZoom = Math.round(zoomLevel * 100);
        //Subtract 10% from the zoom or round to lower 10% interval - but not less than zero
        const newPercentageZoom = Math.max(Math.ceil(currentPercentageZoom / 10) * 10 - 10, 0);
        updateZoom(newPercentageZoom / 100);
    }

    const cyRef = useRef<HTMLDivElement>(null);
    const [cy, setCy] = useState<Core | null>(null);
    const { zoomLevel, updateZoom } = useContext(ZoomContext);
    const [selectedNode, setSelectedNode] = useState<Node['data'] | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge['data'] | null>(null);

    function getNodeLabelTemplateGenerator(selected = false): (data: Node['data']) => string {
        return (data: Node['data']) => {
            if (data.isShell) {
                // Shell node[new node]
                return `<div class="shell-node-container" data-id="${data.id}">
                <div class="node-btn-plus node-top-plus" data-nodeid="${data.id}" title="Create connection from this node">+</div>
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <p class="title" style="margin: 0; font-weight: bold;">${data.label || 'New Node'}</p>
                    <button class="add-details-btn" data-nodeid="${data.id}">Add Details</button>
                </div>
                <div class="node-btn-plus node-bottom-plus" data-nodeid="${data.id}" title="Create connection from this node">+</div>
            </div>`;
            } else {
                // Regular node
                return `<div class="node element data-id="${data.id}"">
                <p class="title" style="margin: 0; font-weight: bold;">${data.label}</p>
                      <p class="type" style="margin: 2px 0;">${data.type}</p>
                      <p class="description" style="margin: 2px 0;">${isNodeDescActive ? data.description : ''}</p>
                    </div>`;
        };
    }
<<<<<<< Updated upstream
=======
    const refreshNodeLabels = () => {
        if (cy) {
            (cy as Core & { nodeHtmlLabel: any }).nodeHtmlLabel([
                {
                    query: 'node',
                    tpl: getNodeLabelTemplateGenerator(),
                    halign: 'center',
                    valign: 'center',
                    halignBox: 'center',
                    valignBox: 'center',
                },
            ]);
        }
    };

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Handle "Add Details" button click
            if (target.classList.contains('add-details-btn')) {
                event.stopPropagation();
                const nodeId = target.getAttribute('data-nodeid');
                if (nodeId && cy) {
                    const node = cy.getElementById(nodeId);
                    if (node.length > 0) {
                        setSelectedElement(node.data());
                    }
                }
            }

            // Handle plus icon clicks for edge creation
            if (
                target.classList.contains('node-top-plus') ||
                target.classList.contains('node-bottom-plus')
            ) {
                event.stopPropagation();
                const nodeId = target.getAttribute('data-nodeid');
                if (nodeId) {
                    setEdgeCreationSource(nodeId);
                    setIsInEdgeCreationMode(true);
                }
            }
        };

        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, [cy]);

    const addNode = () => {
        if (cy) {
            const newNodeId = `node-${Date.now()}`;
            const shellNodeData = {
                id: newNodeId,
                label: 'New Node',
                type: '',
                description: '',
                isShell: true,
            };

            setNodes((prev) => [...prev, { data: shellNodeData }]);

            cy.add({
                group: 'nodes',
                data: shellNodeData,
                position: { x: 300, y: 300 },
            });

            cy.layout(breadthFirstLayout).run();

            setTimeout(() => {
                refreshNodeLabels();
            }, 100);
        }
    };

    const saveJSON = () => {
        if (cy) {
            // Transform nodes to match the required format
            const formattedNodes = nodes
                .map((node) => {
                    // Skip shell nodes
                    if (node.data.isShell) return null;

                    return {
                        'unique-id': node.data.id,
                        'node-type': node.data.type || '',
                        name: node.data.label || '',
                        description: node.data.description || '',
                        interfaces: [], // Default empty interfaces array
                    };
                })
                .filter((node) => node !== null); // Remove null entries (shell nodes)

            // Transform edges to relationships format
            const formattedRelationships = edges
                .map((edge) => {
                    // Skip shell edges
                    if (edge.data.isShell) return null;

                    return {
                        'unique-id': edge.data.id,
                        description: edge.data.label || '',
                        'relationship-type': {
                            connects: {
                                source: {
                                    node: edge.data.source,
                                },
                                destination: {
                                    node: edge.data.target,
                                    interfaces: [], // Default empty interfaces array
                                },
                            },
                        },
                        protocol: 'HTTPS', // Default protocol
                        authentication: 'OAuth2', // Default authentication
                    };
                })
                .filter((rel) => rel !== null); // Remove null entries (shell edges)

            const exportData = {
                nodes: formattedNodes,
                relationships: formattedRelationships,
            };

            // Create download link
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = 'architecture_diagram.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    };

    const updateElement = (updatedData: Node['data'] | Edge['data']) => {
        if (!cy) return;

        if (updatedData.isShell) {
            updatedData.isShell = false;
        }

        const element = cy.getElementById(updatedData.id);
        if (element.length > 0) {
            element.data(updatedData);

            if ('type' in updatedData) {
                setNodes((prev) =>
                    prev.map((node) =>
                        node.data.id === updatedData.id ? { ...node, data: updatedData } : node
                    )
                );
            } else if ('source' in updatedData && 'target' in updatedData) {
                setEdges((prev) =>
                    prev.map((edge) =>
                        edge.data.id === updatedData.id ? { ...edge, data: updatedData } : edge
                    )
                );
            }

            setSelectedElement(updatedData);
            refreshNodeLabels();
        }
    };
>>>>>>> Stashed changes

    useEffect(() => {
        if (cy) {
            //Ensure cytoscape zoom and context state are synchronised
            if (cy.zoom() !== zoomLevel) {
                updateZoom(cy.zoom());
            }
            (cy as Core & { nodeHtmlLabel: any }).nodeHtmlLabel([
                {
                    query: '.node',
                    tpl: getNodeLabelTemplateGenerator(false),
                },
                {
                    query: '.node:selected',
                    tpl: getNodeLabelTemplateGenerator(true),
                },
            ]);

            //@ts-expect-error types are missing from the library
            cy.on('tap', 'node', (e: Event) => {
                e.preventDefault();
                const node = e.target as unknown as NodeSingular | null;
                setSelectedEdge(null);
                setSelectedNode(node?.data()); // Update state with the clicked node's data
            });

            //@ts-expect-error types are missing from the library
            cy.on('tap', 'edge', (e: Event) => {
                e.preventDefault();
                const edge = e.target as unknown as EdgeSingular | null;
                setSelectedNode(null);
                setSelectedEdge(edge?.data()); // Update state with the clicked node's data
            });

            cy.on('zoom', () => updateZoom(cy.zoom()));
        }
    }, [cy, zoomLevel, updateZoom, isNodeDescActive]);

    useEffect(() => {
        // Initialize Cytoscape instance
        const container = cyRef.current;

        if (!container) return;

        setCy(
            cytoscape({
                container: container, // container to render
                elements: [...nodes, ...edges], // graph data
                style: [
                    {
                        selector: 'edge',
                        style: {
                            width: 2,
                            'curve-style': 'bezier',
                            label: isConDescActive ? 'data(label)' : '', // labels from data property
                            'target-arrow-shape': 'triangle',
                            'text-wrap': 'ellipsis',
                            'text-background-color': 'white',
                            'text-background-opacity': 1,
                            'text-background-padding': '5px',
                        },
                    },
                    {
                        selector: 'node',
                        style: {
                            width: '200px',
                            height: '100px',
                            shape: 'rectangle',
                        },
                    },
                    {
                        selector: ':parent',
                        style: {
                            label: 'data(label)',
                        },
                    },
<<<<<<< Updated upstream
                ],
                layout: breadthFirstLayout,
                boxSelectionEnabled: true,
            })
        );
    }, [nodes, edges, isConDescActive]); // Re-render on cy, nodes or edges change
=======
                };

                // Add to cytoscape
                cytoscapeInstance.add({
                    group: 'edges',
                    data: newEdge.data,
                });

                // Add to state
                setEdges((prev) => [...prev, newEdge]);

                // Reset edge creation mode
                setEdgeCreationSource(null);
                setIsInEdgeCreationMode(false);

                // Select the new edge for editing
                setSelectedElement(newEdge.data);
                return;
            }

            // Normal node selection
            setSelectedElement(nodeData);
        });

        cytoscapeInstance.on('tap', 'edge', (e) => {
            const edge = e.target;
            setSelectedElement(edge.data());
            setEdgeCreationSource(null);
            setIsInEdgeCreationMode(false);
        });

        cytoscapeInstance.on('tap', (e) => {
            if (e.target === cytoscapeInstance) {
                // Clicked on background
                setSelectedElement(null);

                // Only cancel edge creation when click on background is detected
                if (isInEdgeCreationMode) {
                    setEdgeCreationSource(null);
                    setIsInEdgeCreationMode(false);
                }
            }
        });

        cytoscapeInstance.on('zoom', () => {
            updateZoom(cytoscapeInstance.zoom());
        });

        //Apply HTML labels
        setTimeout(() => {
            refreshNodeLabels();
        }, 100);

        return () => {
            if (cytoscapeInstance) {
                cytoscapeInstance.destroy();
            }
        };
    }, [initialNodes, initialEdges]); //Only run on initial nodes/edges change

    //Added visual feedback for edge creation mode
    useEffect(() => {
        if (!cy) return;

        if (isInEdgeCreationMode && edgeCreationSource) {
            // Highlight source node
            cy.getElementById(edgeCreationSource).addClass('edge-source');

            // Set cursor to indicate edge creation mode
            document.body.style.cursor = 'crosshair';

            // Add a notification banner
            const banner = document.createElement('div');

            banner.id = 'edge-creation-banner';
            banner.style.cssText =
                'position: fixed; top: 0; left: 0; right: 0; background: #2196F3; color: white; padding: 10px; text-align: center; z-index: 1000;';
            banner.innerHTML =
                'Edge Creation Mode: Click on a target node to create a connection <button id="cancel-edge" style="margin-left: 10px; padding: 2px 8px; background: white; color: #2196F3; border: none; border-radius: 4px;">Cancel</button>';
            document.body.appendChild(banner);

            const cancelBtn = document.getElementById('cancel-edge');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    setEdgeCreationSource(null);
                    setIsInEdgeCreationMode(false);
                });
            }
        } else {
            // Remove edge creation visual cues
            cy.elements('.edge-source').removeClass('edge-source');
            document.body.style.cursor = 'default';

            // Remove notification banner
            const banner = document.getElementById('edge-creation-banner');
            if (banner) {
                document.body.removeChild(banner);
            }
        }

        return () => {
            // Clean up
            document.body.style.cursor = 'default';
            const banner = document.getElementById('edge-creation-banner');
            if (banner) {
                document.body.removeChild(banner);
            }
        };
    }, [cy, isInEdgeCreationMode, edgeCreationSource]);

    // refresh labels when visibility changes
    useEffect(() => {
        refreshNodeLabels();
    }, [isNodeDescActive, isConDescActive]);
>>>>>>> Stashed changes

    useEffect(() => {
        //Ensure cytoscape zoom and context state are synchronised
        if (cy?.zoom() !== zoomLevel) {
            cy?.zoom(zoomLevel);
        }
    }, [zoomLevel]);

    return (
<<<<<<< Updated upstream
        <div className="relative flex m-auto border">
            {title && (
                <div className="graph-title absolute m-5 bg-primary-content shadow-md">
                    <span className="text-m font-thin">Architecture: </span>
                    <span className="text-m font-semibold">{title}</span>
                </div>
            )}
            <div
                ref={cyRef}
                className="flex-1 bg-white visualizer"
                style={{
                    height: '100vh',
                }}
            />
            {selectedNode && (
                <div className="absolute right-0 h-full">
                    <Sidebar
                        selectedData={selectedNode}
                        closeSidebar={() => setSelectedNode(null)}
                    />
                </div>
            )}

            {selectedEdge && (
                <div className="absolute right-0 h-full">
                    <Sidebar
                        selectedData={selectedEdge}
                        closeSidebar={() => setSelectedEdge(null)}
                    />
                </div>
            )}
        </div>
=======
        <>
            <div className="p-4 bg-gray-100 flex flex-wrap items-center gap-4 border-b">
                {title && (
                    <div className="flex items-center gap-2">
                        <span className="text-base font-thin">Architecture:</span>
                        <span className="text-base font-semibold">{title}</span>
                    </div>
                )}
                <button
                    onClick={addNode}
                    className="btn btn-primary flex items-center gap-2"
                    aria-label="Add Node"
                >
                    <IoAddOutline /> Add Node
                </button>
                <button
                    onClick={saveJSON}
                    className="btn btn-success flex items-center gap-2"
                    aria-label="Save JSON"
                >
                    <IoSaveOutline /> Save JSON
                </button>
                {isInEdgeCreationMode && (
                    <div className="ml-auto text-blue-600 font-semibold flex items-center">
                        Edge Creation Mode
                        <button
                            onClick={() => {
                                setEdgeCreationSource(null);
                                setIsInEdgeCreationMode(false);
                            }}
                            className="ml-2 btn btn-sm btn-outline btn-error"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
            <div className="relative flex flex-col h-screen">
                <div className="flex items-center space-x-4">
                    <div className="label">
                        <span className="label label-text text-base-content">
                            Zoom: {(zoomLevel * 100).toFixed(0)}%
                        </span>
                        <button className="btn btn-xs ms-1 ps-2 pe-2" onClick={zoomIn}>
                            +
                        </button>
                        <button className="btn btn-xs ms-1 ps-2 pe-2" onClick={zoomOut}>
                            -
                        </button>
                    </div>
                </div>
                <div className="flex flex-1 relative">
                    <div
                        ref={cyRef}
                        className="flex-1 bg-white visualizer"
                        style={{
                            height: 'calc(100vh - 68px)',
                        }}
                    />
                    {selectedElement && (
                        <div className="absolute right-0 h-full">
                            <Sidebar
                                selectedData={selectedElement}
                                closeSidebar={() => setSelectedElement(null)}
                                updateElement={updateElement}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
>>>>>>> Stashed changes
    );
};

export default CytoscapeRenderer;
