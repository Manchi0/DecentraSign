"""
LLM Client for Claude Sonnet API calls
"""
import os
from anthropic import Anthropic


def call_claude_sonnet(prompt: str, system_prompt: str = None, max_tokens: int = 4096, temperature: float = 1.0) -> str:
    """
    Make an API call to Claude Sonnet.
    
    Args:
        prompt (str): The user prompt/message to send to Claude
        system_prompt (str, optional): System prompt to guide Claude's behavior
        max_tokens (int): Maximum tokens in the response (default: 4096)
        temperature (float): Temperature for response randomness 0-1 (default: 1.0)
        
    Returns:
        str: The response text from Claude
        
    Raises:
        RuntimeError: If ANTHROPIC_API_KEY environment variable is not set
        Exception: If the API call fails
    """
    # Get API key from environment variable
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY environment variable is not set. "
            "Please set it with your API key: export ANTHROPIC_API_KEY='your-api-key'"
        )
    
    try:
        # Initialize the Anthropic client
        client = Anthropic(api_key=api_key)
        
        # Prepare the message
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # Make the API call
        kwargs = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        }
        
        # Add system prompt if provided
        if system_prompt:
            kwargs["system"] = system_prompt
        
        response = client.messages.create(**kwargs)
        
        # Extract and return the text content
        return response.content[0].text
        
    except Exception as e:
        raise Exception(f"Error calling Claude API: {str(e)}")


def main():
    """
    Example usage of the Claude Sonnet API client.
    """
    # Example prompt - replace with your actual prompt
    user_prompt = """
    # YOUR PROMPT HERE
    """
    
    system_prompt = "You are a helpful assistant."
    
    try:
        response = call_claude_sonnet(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=4096,
            temperature=0.7
        )
        
        print("Claude's Response:")
        print("-" * 80)
        print(response)
        print("-" * 80)
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
