import { OpenAI } from "@llamaindex/openai";
import {
  createStatefulMiddleware,
  createWorkflow,
  workflowEvent,
} from "@llamaindex/workflow";

// Create LLM instance
const llm = new OpenAI({ model: "gpt-4.1-mini" });

// Define our workflow events
const startEvent = workflowEvent<string>(); // Input topic for message
const valentinesEvent = workflowEvent<{ message: string }>(); // Intermediate message
const critiqueEvent = workflowEvent<{ message: string; critique: string }>(); // Intermediate critique
const resultEvent = workflowEvent<{ message: string; critique: string }>(); // Final message + critique

// Create our workflow
const { withState, getContext } = createStatefulMiddleware(() => ({
  numIterations: 0,
  maxIterations: 3,
}));

const valentinesMessageFlow = withState(createWorkflow());

// Define handlers for each step
valentinesMessageFlow.handle([startEvent], async (event) => {
  // Prompt the LLM to write a message
  const prompt = `Write your best valentines message about ${event.data}. Write the message between <message> and </message> tags.`;
  const response = await llm.complete({ prompt });

  // Parse the message from the response
  const message =
    response.text.match(/<message>([\s\S]*?)<\/message>/)?.[1]?.trim() ??
    response.text;
  return valentinesEvent.with({ message: message });
});

valentinesMessageFlow.handle([valentinesEvent], async (event) => {
  // Prompt the LLM to critique the message
  const prompt = `Give a thorough critique of the following valentines message. If the message needs improvement, put "IMPROVE" somewhere in the critique: ${event.data.message}`;
  const response = await llm.complete({ prompt });

  // If the critique includes "IMPROVE", keep iterating, else, return the result
  if (response.text.includes("IMPROVE")) {
    return critiqueEvent.with({
      message: event.data.message,
      critique: response.text,
    });
  }

  return resultEvent.with({ message: event.data.message, critique: response.text });
});

valentinesMessageFlow.handle([critiqueEvent], async (event) => {
  // Keep track of the number of iterations
  const state = getContext().state;
  state.numIterations++;

  // Write a new message based on the previous message and critique
  const prompt = `Write a new valentines message based on the following critique and the original message. Write the message between <message> and </message> tags.\n\nMessage: ${event.data.message}\n\nCritique: ${event.data.critique}`;
  const response = await llm.complete({ prompt });

  // Parse the message from the response
  const message =
    response.text.match(/<message>([\s\S]*?)<\/message>/)?.[1]?.trim() ??
    response.text;

  // If we've done less than the max number of iterations, keep iterating
  // else, return the result
  if (state.numIterations < state.maxIterations) {
    return valentinesEvent.with({ message: message });
  }

  return resultEvent.with({ message: message, critique: event.data.critique });
});

// Usage
async function main() {
  const { stream, sendEvent } = valentinesMessageFlow.createContext();
  sendEvent(startEvent.with("my lovely daughter"));

  let result: { message: string; critique: string } | undefined;

  for await (const event of stream) {
    console.log(event.data);  // optionally log the event data
    if (resultEvent.include(event)) {
      result = event.data;
      break; // Stop when we get the final result
    }
  }

  console.log(result);
}

main().catch(console.error);