from sqlalchemy import create_engine, text

# Updated with your actual database URL
DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/itrc_cc_db"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("UPDATE evaluations SET status = 'COMPLETED' WHERE status = 'completed';"))
    conn.execute(text("UPDATE evaluations SET status = 'IN_PROGRESS' WHERE status = 'in_progress';"))
    conn.execute(text("UPDATE evaluations SET status = 'ON_HOLD' WHERE status = 'on_hold';"))
    conn.commit()
    print("Status values updated successfully.") 