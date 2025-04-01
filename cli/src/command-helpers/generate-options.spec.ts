import { CalmChoice } from '@finos/calm-shared/commands/generate/components/options';
import { promptUserForOptions } from './generate-options';

const mocks = vi.hoisted(() => {
    return {
        extractOptions: vi.fn(),
        prompt: vi.fn()
    };
});

vi.mock('@finos/calm-shared/commands/generate/components/options', () => ({
    extractOptions: mocks.extractOptions
}));

vi.mock('inquirer', () => ({
    default: {    
        prompt: mocks.prompt
    }
}));

const choice1 = { description: 'Option 1', nodes: ['option1'], relationships: ['relationship1'] };
const choice2 = { description: 'Option 2', nodes: ['option2'], relationships: ['relationship2'] };

const choiceA = { description: 'Option A', nodes: ['optionA'], relationships: ['relationshipA'] };
const choiceB = { description: 'Option B', nodes: ['optionB'], relationships: ['relationshipB'] };

const pattern = {}; // pattern doesn't matter since we're mocking the extractOptions function

describe('promptUserForOptions', () => {
    it('should prompt user for options and return selected choices', async () => {
        mocks.extractOptions.mockReturnValue([
            {
                optionType: 'oneOf',
                prompt: 'Choose an option:',
                choices: [choice1, choice2]
            },
            {
                optionType: 'anyOf',
                prompt: 'Select any of these options:',
                choices: [choiceA, choiceB]
            }
        ]);
        mocks.prompt.mockReturnValue(Promise.resolve({
            0: 'Option 1',
            1: ['Option A']
        }));

        const expectedChoices: CalmChoice[] = [choice1, choiceA];
        await expect(promptUserForOptions(pattern)).resolves.toEqual(expectedChoices);
    });

    it('should return empty list when user selects nothing', async () => {
        mocks.extractOptions.mockReturnValue([{
            optionType: 'anyOf',
            prompt: 'Select any of these options:',
            choices: [choiceA, choiceB]
        }]);
        mocks.prompt.mockReturnValue(Promise.resolve({})); // user selects nothing

        await expect(promptUserForOptions(pattern)).resolves.toEqual([]);
    });

    it('should throw an error when user selects an option thats not in the pattern', async () => {
        mocks.extractOptions.mockReturnValue([{
            optionType: 'oneOf',
            prompt: 'Choose an option:',
            choices: [choice1, choice2]
        }]);
        mocks.prompt.mockReturnValue(Promise.resolve({
            0: 'Invalid Option'
        }));

        await expect(promptUserForOptions(pattern)).rejects.toThrow('The choice of [Invalid Option] is not a valid choice in the pattern.');
    });
});