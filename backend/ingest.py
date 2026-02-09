"""
SalesGPT - Data Ingestion Script

This script loads markdown files from the data/ directory, chunks them,
generates embeddings using a local HuggingFace model, and uploads them
to Supabase with pgvector.

Usage:
    python backend/ingest.py

Requirements:
    - .env file with SUPABASE_URL and SUPABASE_KEY
    - data/ directory with .md files
    - Virtual environment activated with dependencies installed
"""

import os
import sys
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
import time

# ============================================
# Configuration
# ============================================

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"

# Chunking parameters
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Embedding model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# ============================================
# Initialize Supabase Client
# ============================================

print("🔗 Connecting to Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Connected to Supabase\n")

# ============================================
# Initialize Embedding Model
# ============================================

print(f"🤖 Loading embedding model: {EMBEDDING_MODEL}")
print("   (This may take a minute on first run - downloading model...)")

embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={'device': 'cpu'},  # Force CPU (no GPU required)
    encode_kwargs={'normalize_embeddings': True}  # Normalize for cosine similarity
)

print("✅ Embedding model loaded\n")

# ============================================
# Load Markdown Files
# ============================================

def load_markdown_files(data_dir: Path) -> List[Document]:
    """
    Load all .md files from the data directory.
    
    Args:
        data_dir: Path to data directory
        
    Returns:
        List of LangChain Document objects with content and metadata
    """
    documents = []
    
    if not data_dir.exists():
        print(f"❌ Error: Data directory not found: {data_dir}")
        sys.exit(1)
    
    md_files = list(data_dir.glob("*.md"))
    
    if not md_files:
        print(f"❌ Error: No .md files found in {data_dir}")
        sys.exit(1)
    
    print(f"📂 Found {len(md_files)} markdown files:")
    
    for md_file in md_files:
        print(f"   - {md_file.name}")
        
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Create LangChain Document with metadata
            doc = Document(
                page_content=content,
                metadata={
                    "source": md_file.name,
                    "filename": md_file.stem,  # Without .md extension
                    "file_path": str(md_file)
                }
            )
            documents.append(doc)
            
        except Exception as e:
            print(f"   ⚠️  Warning: Failed to load {md_file.name}: {e}")
    
    print(f"✅ Loaded {len(documents)} documents\n")
    return documents

# ============================================
# Split Documents into Chunks
# ============================================

def split_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into smaller chunks for better retrieval.
    
    Args:
        documents: List of LangChain Document objects
        
    Returns:
        List of chunked Document objects
    """
    print(f"✂️  Splitting documents (chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]  # Respect paragraph breaks
    )
    
    chunks = text_splitter.split_documents(documents)
    
    print(f"✅ Created {len(chunks)} chunks\n")
    return chunks

# ============================================
# Generate Embeddings
# ============================================

def generate_embeddings(chunks: List[Document]) -> List[Dict]:
    """
    Generate embeddings for each chunk using HuggingFace model.
    
    Args:
        chunks: List of chunked Document objects
        
    Returns:
        List of dictionaries ready for Supabase insertion
    """
    print(f"🧠 Generating embeddings for {len(chunks)} chunks...")
    print("   (This may take 2-3 minutes on CPU...)")
    
    start_time = time.time()
    records = []
    
    for i, chunk in enumerate(chunks, 1):
        # Generate embedding for this chunk
        embedding = embeddings.embed_query(chunk.page_content)
        
        # Prepare record for Supabase
        record = {
            "content": chunk.page_content,
            "embedding": embedding,  # pgvector will handle this
            "metadata": chunk.metadata
        }
        records.append(record)
        
        # Progress indicator
        if i % 10 == 0 or i == len(chunks):
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            print(f"   Progress: {i}/{len(chunks)} chunks ({rate:.1f} chunks/sec)")
    
    elapsed = time.time() - start_time
    print(f"✅ Generated {len(records)} embeddings in {elapsed:.1f} seconds\n")
    
    return records

# ============================================
# Upload to Supabase
# ============================================

def upload_to_supabase(records: List[Dict]) -> None:
    """
    Upload records to Supabase documents table.
    
    Args:
        records: List of dictionaries with content, embedding, metadata
    """
    print(f"☁️  Uploading {len(records)} records to Supabase...")
    
    # Clear existing data (optional - comment out if you want to append)
    print("   Clearing existing documents...")
    try:
        supabase.table("documents").delete().neq("id", 0).execute()
        print("   ✅ Cleared existing documents")
    except Exception as e:
        print(f"   ⚠️  Warning: Could not clear existing documents: {e}")
    
    # Upload in batches (Supabase has limits on batch size)
    BATCH_SIZE = 100
    total_uploaded = 0
    
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        
        try:
            response = supabase.table("documents").insert(batch).execute()
            total_uploaded += len(batch)
            print(f"   Uploaded batch {i//BATCH_SIZE + 1}: {total_uploaded}/{len(records)} records")
        except Exception as e:
            print(f"   ❌ Error uploading batch {i//BATCH_SIZE + 1}: {e}")
            print(f"   Batch data: {batch[0] if batch else 'empty'}")
            raise
    
    print(f"✅ Successfully uploaded {total_uploaded} records to Supabase\n")

# ============================================
# Main Execution
# ============================================

def main():
    """Main ingestion pipeline."""
    print("=" * 60)
    print("🚀 SalesGPT Data Ingestion Pipeline")
    print("=" * 60)
    print()
    
    try:
        # Step 1: Load markdown files
        documents = load_markdown_files(DATA_DIR)
        
        # Step 2: Split into chunks
        chunks = split_documents(documents)
        
        # Step 3: Generate embeddings
        records = generate_embeddings(chunks)
        
        # Step 4: Upload to Supabase
        upload_to_supabase(records)
        
        print("=" * 60)
        print("✅ INGESTION COMPLETE!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print(f"   - Documents loaded: {len(documents)}")
        print(f"   - Chunks created: {len(chunks)}")
        print(f"   - Records uploaded: {len(records)}")
        print()
        print("🔍 Next steps:")
        print("   1. Verify data in Supabase dashboard")
        print("   2. Test RAG queries")
        print("   3. Build the FastAPI backend")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ INGESTION FAILED")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
