"""
Quick script to verify data was ingested into Supabase.

Run this to check if the documents table has data.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check document count
result = supabase.table("documents").select("id", count="exact").execute()
count = result.count

print(f"📊 Total documents in Supabase: {count}")

if count > 0:
    # Get sample documents
    sample = supabase.table("documents").select("id, content, metadata").limit(3).execute()
    
    print(f"\n📄 Sample documents:")
    for i, doc in enumerate(sample.data, 1):
        content_preview = doc['content'][:100] + "..." if len(doc['content']) > 100 else doc['content']
        source = doc['metadata'].get('source', 'Unknown')
        print(f"\n{i}. Source: {source}")
        print(f"   Content: {content_preview}")
else:
    print("\n❌ No documents found! You need to run the ingestion script:")
    print("   python backend/ingest.py")
