import mysql.connector

con = mysql.connector.connect(
    host="localhost",
    user="root",
    password="30032004"
)

cur = con.cursor()

# Drop & recreate DB to avoid duplicates
cur.execute("DROP DATABASE IF EXISTS flight_booking;")
cur.execute("CREATE DATABASE flight_booking;")
cur.execute("USE flight_booking;")

# Read the SQL file
with open("schema_mysql.sql", "r", encoding="utf-8") as f:
    sql_script = f.read()

# Split and execute safely
for stmt in sql_script.split(";"):
    stmt = stmt.strip()
    if stmt and not stmt.startswith("--"):
        try:
            cur.execute(stmt)
            con.commit()  # commit after each valid statement
        except mysql.connector.Error as e:
            print(f"⚠️ Skipped: {stmt[:60]}...")
            print("   Error:", e)

cur.close()
con.close()
print("\n✅ Database created & populated successfully!")
