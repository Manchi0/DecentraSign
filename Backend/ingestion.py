# ingest.py
import os
import argparse
from pathlib import Path

# --- Configuration ---
# This list can be expanded as needed.
ALLOWED_EXTENSIONS = {'.pdf'}


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from PDF using OCR.
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text from the PDF
    """
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise RuntimeError("PyMuPDF (fitz) is required. Install with: pip install pymupdf") from e
    try:
        import pytesseract
    except ImportError as e:
        raise RuntimeError("pytesseract is required for OCR. Install with: pip install pytesseract") from e
    try:
        from PIL import Image
    except ImportError as e:
        raise RuntimeError("Pillow is required for OCR. Install with: pip install Pillow") from e

    text = ""
    pdf_path = Path(pdf_path)

    with fitz.open(pdf_path) as doc:
        num_pages = len(doc)
        for page_index in range(num_pages):
            page = doc[page_index]
            # Render page to image
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            page_text = pytesseract.image_to_string(img)
            text += page_text + "\n"
            print(f"Processed page {page_index + 1}/{num_pages}")

    return text

def main():
    """
    Main function to orchestrate the ingestion pipeline.
    """
    parser = argparse.ArgumentParser(description='Extract text from PDF files using OCR')
    parser.add_argument('pdf_path', help='Path to the PDF file to process')
    parser.add_argument('-o', '--output', help='Output file path (optional)', default=None)
    
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf_path):
        print(f"Error: File not found: {args.pdf_path}")
        return
    
    try:
        extracted_text = extract_text_from_pdf(args.pdf_path)
        
        if args.output:
            output_file = args.output
        else:
            # Create output filename based on input
            pdf_path = Path(args.pdf_path)
            output_file = pdf_path.with_suffix('.txt')
        
        # Save extracted text to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(extracted_text)
        
        print(f"\nProcessing complete. Output saved to: {output_file}")
        print(f"Extracted {len(extracted_text)} characters")
    except Exception as e:
        print(f"\nError processing file: {e}")
        return
    


# This ensures the main() function is called only when the script is executed directly.
if __name__ == "__main__":
    main()