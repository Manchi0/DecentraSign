"""
Main pipeline: Extract text from PDF and process with Claude Sonnet LLM
"""
import argparse
import os
from pathlib import Path
from Backend.ingestion import extract_text_from_pdf
from Backend.MoveLLM import LLMInput


def process_pdf_with_llm(pdf_path: str, output_dir: str = None, system_prompt: str = None, user_prompt_template: str = None):
    """
    Extract text from PDF and send it to Claude Sonnet for processing.
    
    Args:
        pdf_path (str): Path to the PDF file to process
        output_dir (str, optional): Directory to save outputs. Defaults to same directory as PDF
        system_prompt (str, optional): System prompt for Claude
        user_prompt_template (str, optional): User prompt template. Use {extracted_text} as placeholder
        
    Returns:
        tuple: (extracted_text, llm_response)
    """
    print(f"\n{'='*80}")
    print(f"Processing PDF: {pdf_path}")
    print(f"{'='*80}\n")
    
    # Step 1: Extract text from PDF
    print("Step 1: Extracting text from PDF using OCR...")
    extracted_text = extract_text_from_pdf(pdf_path)
    print(f"✓ Extraction complete. Extracted {len(extracted_text)} characters\n")
    
    # Setup output directory
    if output_dir is None:
        output_dir = Path(pdf_path).parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save extracted text
    pdf_name = Path(pdf_path).stem
    extracted_text_file = output_dir / f"{pdf_name}_extracted.txt"
    with open(extracted_text_file, 'w', encoding='utf-8') as f:
        f.write(extracted_text)
    print(f"✓ Extracted text saved to: {extracted_text_file}\n")
    
    # Step 2: Send to Claude Sonnet
    print("Step 2: Sending extracted text to Claude Sonnet...")
    
    # Default prompts if not provided
    if system_prompt is None:
        system_prompt = "You are a helpful assistant that analyzes and summarizes documents."
    
    if user_prompt_template is None:
        user_prompt_template = """Please analyze the following text extracted from a PDF document and provide:
1. A brief summary of the main content
2. Key points or important information
3. Any notable patterns or insights

Extracted text:
{extracted_text}"""
    
    # Format the user prompt with extracted text
    user_prompt = user_prompt_template.format(extracted_text=extracted_text)
    
    # Call Claude
    llm_response = LLMInput(
        prompt=user_prompt,
        system_prompt=system_prompt,
        max_tokens=4096,
        temperature=0.7
    )
    
    print(f"✓ LLM processing complete\n")
    
    # Save LLM response
    llm_response_file = output_dir / f"{pdf_name}_llm_response.txt"
    with open(llm_response_file, 'w', encoding='utf-8') as f:
        f.write(llm_response)
    print(f"✓ LLM response saved to: {llm_response_file}\n")
    
    return extracted_text, llm_response


def main():
    """
    Main function with CLI interface.
    """
    parser = argparse.ArgumentParser(
        description='Extract text from PDF and process with Claude Sonnet LLM'
    )
    parser.add_argument('pdf_path', help='Path to the PDF file to process')
    parser.add_argument('-o', '--output-dir', help='Output directory for results', default=None)
    parser.add_argument('-s', '--system-prompt', help='System prompt for Claude', default=None)
    parser.add_argument('-p', '--user-prompt', help='User prompt template (use {extracted_text} as placeholder)', default=None)
    parser.add_argument('--show-response', action='store_true', help='Print LLM response to console')
    
    args = parser.parse_args()
    
    # Check if PDF exists
    if not os.path.exists(args.pdf_path):
        print(f"❌ Error: File not found: {args.pdf_path}")
        return 1
    
    try:
        # Process the PDF with LLM
        extracted_text, llm_response = process_pdf_with_llm(
            pdf_path=args.pdf_path,
            output_dir=args.output_dir,
            system_prompt=args.system_prompt,
            user_prompt_template=args.user_prompt
        )
        
        # Optionally show the response
        if args.show_response:
            print(f"\n{'='*80}")
            print("Claude's Response:")
            print(f"{'='*80}\n")
            print(llm_response)
            print(f"\n{'='*80}\n")
        
        print("✅ Processing complete!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
