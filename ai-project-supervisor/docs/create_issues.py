import csv
import subprocess
import sys
from pathlib import Path

CSV_PATH = Path(__file__).parent / "backlog.csv"


def main() -> int:
    run = "--run" in sys.argv
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    for row in rows:
        title = f"{row['ID']} {row['Task']}"
        body = (
            f"Sprint: {row['Sprint']} - {row['Sprint goal']}\n"
            f"Module: {row['Module']}\n"
            f"Type: {row['Type']}\n"
            f"Estimate: {row['Hours']} h\n"
            f"Priority: {row['Priority']}"
        )
        labels = f"sprint-{row['Sprint']},{row['Type']},{row['Priority']}"
        command = ["gh", "issue", "create", "--title", title, "--body", body, "--label", labels]
        if run:
            subprocess.run(command, check=True)
        else:
            print(" ".join(repr(part) if " " in part else part for part in command))

    print(f"{len(rows)} tasks", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
