from pathlib import Path
import pandas as pd, json, hashlib, platform, tempfile, logging

ROOT = Path(__file__).resolve().parents[2] / "02_PRACTICE"
DATA_ZIP = ROOT / "C2_05_PRACTICE_DATA_RC1.zip"

def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def main():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td)
        import zipfile
        with zipfile.ZipFile(DATA_ZIP) as z:
            z.extractall(td/"data")
        d=td/"data"
        expected=["sales_2026-04.csv","sales_2026-05.csv","sales_2026-06.csv"]
        monthly=d/"monthly"
        files=[monthly/x for x in expected]
        assert all(p.exists() for p in files)
        parts=[]
        for p in files:
            df=pd.read_csv(p)
            req={"order_id","customer_id","order_date","channel","quantity","unit_price","discount_pct","net_sales"}
            assert req.issubset(df.columns)
            df["source_file"]=p.name
            parts.append(df)
        sales=pd.concat(parts,ignore_index=True)
        assert len(sales)==90
        sales["order_date"]=pd.to_datetime(sales["order_date"],errors="raise")
        for col in ["quantity","unit_price","discount_pct","net_sales"]:
            sales[col]=pd.to_numeric(sales[col],errors="raise")
        calc=(sales["quantity"]*sales["unit_price"]*(1-sales["discount_pct"])).round(2)
        assert (calc-sales["net_sales"]).abs().round(2).max() <= 0.01

        cust=pd.read_csv(d/"customer_master_dirty.csv")
        assert not cust["customer_id"].is_unique
        dup=cust.loc[cust["customer_id"].duplicated(keep=False),"customer_id"].unique().tolist()
        assert "C007" in dup

        nested=json.loads((d/"nested_orders.json").read_text(encoding="utf-8"))
        item_count=sum(len(o["items"]) for o in nested["orders"])
        assert item_count==6

        api=json.loads((d/"api_response.json").read_text(encoding="utf-8"))
        assert len(api["customers"])==4

        # Exercise round-trip Excel on a clean summary independent of dirty master.
        sales = sales.assign(channel_clean=sales["channel"].astype("string").str.strip().str.lower())
        summary=sales.groupby("channel_clean",as_index=False)["net_sales"].sum()
        out=td/"report.xlsx"
        summary.to_excel(out,index=False)
        check=pd.read_excel(out)
        assert round(check["net_sales"].sum(),2)==round(summary["net_sales"].sum(),2)

        manifest={
            "python":platform.python_version(),
            "pandas":pd.__version__,
            "inputs":[{"name":p.name,"sha256":sha256(p)} for p in files],
            "rows":len(sales),
            "output_sha256":sha256(out)
        }
        (td/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
        assert json.loads((td/"manifest.json").read_text(encoding="utf-8"))["rows"]==90
        print(json.dumps({"status":"PASS","python":platform.python_version(),"pandas":pd.__version__,"rows":len(sales),"nested_items":item_count},indent=2))

if __name__=="__main__":
    main()
