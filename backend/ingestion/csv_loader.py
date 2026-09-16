from typing import List, Dict, Any
import pandas as pd

def load_csv(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract structured tabular text from a CSV file using pandas.
    Converts meaningful rows into clear, searchable descriptive statements.
    """
    df = pd.read_csv(file_path)
    extracted_items = []
    
    # Fill NaN values with empty string
    df = df.fillna("")
    
    # Summary of columns
    columns_str = ", ".join(df.columns.astype(str))
    
    row_strings = []
    for idx, row in df.iterrows():
        fields = [f"{col}: {val}" for col, val in row.items() if str(val).strip()]
        if fields:
            row_text = f"Record #{idx + 1} | " + " | ".join(fields)
            row_strings.append(row_text)
            
    # Group rows in batches to preserve tabular context
    batch_size = 10
    for i in range(0, len(row_strings), batch_size):
        batch = row_strings[i : i + batch_size]
        text_block = f"Table Columns: [{columns_str}]\n" + "\n".join(batch)
        extracted_items.append({
            "text": text_block,
            "page_number": None,
            "section": f"Records {i+1} to {min(i+batch_size, len(row_strings))}"
        })
        
    return extracted_items
