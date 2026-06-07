"""
SalesGPT - Auto Migration Script
Reads schema.sql and runs it against the database on startup.
"""

import os
import psycopg2
from backend.utils import get_logger

logger = get_logger(__name__)

def run_auto_migrations():
    """
    Connect to PostgreSQL using DATABASE_URL and execute schema.sql
    """
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        logger.warning("DATABASE_URL not found. Skipping auto-migrations.")
        logger.warning("To enable auto-migrations, add your Supabase Postgres Connection String as DATABASE_URL.")
        return

    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "schema.sql")
    
    if not os.path.exists(schema_path):
        logger.error("schema.sql not found at %s. Skipping migrations.", schema_path)
        return
        
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            sql = f.read()
            
        logger.info("Connecting to database for auto-migration...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        
        with conn.cursor() as cur:
            logger.info("Executing schema.sql...")
            cur.execute(sql)
            logger.info("Auto-migration completed successfully.")
            
    except Exception as e:
        logger.error("Auto-migration failed: %s", e, exc_info=True)
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    run_auto_migrations()
