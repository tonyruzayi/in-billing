import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPA_URL = "/supabase";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZXRkYXp1dGt4dmFpeGJobm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjEyNzAsImV4cCI6MjA4ODg5NzI3MH0.QbnIMpr8Gwur7TmU8J3Re1rdEpzufnwcBYeGC7CVn1Y";
const H = { "Content-Type": "application/json", "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}` };

// ── SUPABASE SQL (run once in Supabase SQL Editor) ─────────────────────────
// CREATE TABLE IF NOT EXISTS cc_districts (id bigint generated always as identity primary key, name text unique not null, created_at timestamptz default now());
// ALTER TABLE cc_branches ADD COLUMN IF NOT EXISTS district text;
// ALTER TABLE cc_stats ADD COLUMN IF NOT EXISTS cell text;
// ALTER TABLE cc_stats ADD COLUMN IF NOT EXISTS district text;
// ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS district text;
// ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS cell text;
// ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS view_branches text; -- JSON array of branch names
// ALTER TABLE cc_users ADD COLUMN IF NOT EXISTS view_cells text;    -- JSON array of cell names
// CREATE TABLE IF NOT EXISTS cc_cells (id bigint generated always as identity primary key, name text unique not null, district text, created_at timestamptz default now());

const db = {
  async get(table, params = "") {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, { headers: { ...H, "Prefer": "return=representation" } });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, body) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, "Prefer": "return=representation" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(table, match, body) {
    const params = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, { method: "PATCH", headers: { ...H, "Prefer": "return=representation" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async upsert(table, body) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, "Prefer": "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, match) {
    const params = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, { method: "DELETE", headers: H });
    if (!r.ok) throw new Error(await r.text());
    return true;
  },
};

// ── LOGO ──────────────────────────────────────────────────────────────────────
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAfDklEQVR4nO3dXXbiVrow4Dff6nv7G0HRIwg9gpARxLngcFlkAgd6BHFG0OZMINQlh4umRhBqBI1H0PYI2h5BnQttxxSWhCRkg/DzrOWVikB7byOs/Wr/RgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFDPd8cuAM18/fr12EXgDI0my15E9CKiHxEPEXG3mA3XRysQJ++771QjXeXKdZQAgDaNJstxREwj4vuclx8j4mYxG16/YZHoCAFAd7lyHSUAoA2jyXIQEfOI+FDh7Z8Ws+H4NctD9wgAuuv/HbsAwHGkp/4/olrlHxHxMZ0DnAEBALxDqSL/vcGp03ZLAhyLAADemdFkeRXNKv+I/DECQAcJAOAdGU2Wl5H1+QPvnAAA3pdpRFwcuxDA8QkA4H0ZH3j+bRuFAI5PAADvxGiy7Ef1Ef9F1oeXBDgFAgB4P/otpHHTQhrACRAAwPvRO/D8z4vZ8K6FcgAn4C/HLgDQGT+NJsuvkS0NvImIu/SzjmzPgLsjlQtowBqOHWUpYOpK8///+YpZPAUG64hY20TofbAUcHe5ch0lAKCqNPhvnH7ecgrgY2TBwGoxG87z3rC1++AgHdpExIPgoTsEAN3lynWUAIB99uzw99YeI2IVEdeL2fAuBSU3EfFDyTmfoyR44DQIALrLlesoAQBFUsV/HYdP+XstnyN74q/aGnEfEdPFbLh6rQLRnACgu1y5jhIAsCv18d/E6Vb8RT5HtjzxQ/r/y4i4Sj/bQYLtiE+QAKC7XLmOEgDwJPWjz6O8Ob0Nt5GN+t9EVllvtl7bLGbDh90TUlP/5dahQUT8uvX/hZV62rdguvP+24gY5OXFcQgAusuV6ygBABERo8lyGllz/2sM7vsc2SC+TVuD8kaT5SAi/tg69OO+tFMQsY7n31FLwAkRAHSXK9dRAoD3LT0dr6L9p/5PkQ28W7Wc7p/SWgJPfq6SVwoC/lX3PF6fAKC7rAQIHZMqw020V/nfR8RvEfH/F7Ph+A0q1k9b/55WOWExG252zhu3Vxx4n6wECB2SBvrNo50m/8fIpuXdtJBWHdfxPMDvh9FkOa/YpL+KiI/p3z+9RsHgPdECAB2Rpvf9M9qp/GcR0TtC5R9pyeCrrUMfR5PlKnVrlBm8UpHgXdJ501HGALwvqfL/vYWkHiPi6hRW2ksDAlfxHNA8RjaNcb67r0Aa7PiPrUO3i9mw/8pFpAJjALrLlesoAcD70WLlf3JT6EqmMN5HNuUwItvGeLfVwyDAEyEA6C5XrqMEAO9DzrS5pk6u8t+Wfs9p7O/bf4xsVcD5KxeJigQA3eXKdZQA4PzlzH9v6qQr/21pHMBVZE/9/a2X7uJ5Y6GHNy0UpQQA3eXKdZQA4LylinAdh2/k05nKn24SAHSXWQBwmm7i8Mr/acDfw8GlAc6OAABOTJrr/3Hf+yoY746mB3ii7aajdAGcp9T0fxeH9/t/XsyGV4eWB/bRBdBdWgDgtFxHOwv9TFtIAzhjQreO0gJwftKc+H+3kJTd8ngzWgC6SwsAnI7rE0sHOGNCt47SAnBeWnz61/fPm9IC0F1aAOA0XLeUzryldIAzJ3TrKC0A5yON/P9PG2ktZkN/07wpLQDdpQUAjm/cUjpfWkoHeAcEAHB845bS2bSUDvAOCADgiNLgv0OX/H3y0FI6wDsgAIDjumoxrYcW0wLOnAAAjmvQYlqXLaYFnDkBABzX4NgFAN4nAQAcSer/b2Pd/ye9FtMCzpwAAI6n33J6g5bTA86YAACOp99yeh9SqwLAXgIAOJ7eK6R5/QppAmdIAADH03uFND+OJsv+K6QLnBkBAJyfedpfAKCQAADOz/cRsRYEAGUEAHCevo+IzSl3B4wmy8vRZHk9mixvjl0WeI/+cuwCAK/mQ0T8azRZ/hYRN4vZ8OHI5YmIP7c/nqafi4j4dMTiwLulBQDO36+RtQaMj1mI0WTZG02W84j4TyrTRUTcRhYIAG/su2MXgGa+fv167CJwoNFkuY6IH9442/uIuImI+Vu1CKRuiGlEfNx56TYiBqfSMkEz332nGukqV66jBADdd6QAYNvniFhFxKrtSjgtSHQVEePI3+5Y5X8mBADd5cp1lACg+9Lgt8mxy5HcRsQ6IjYRsVnMhps6J6en/H5kyxEPIht/UJaXyv9MCAC6yyBAOJ6HYxdgy/ex9aQ+miwjIh4jCwiePP27v3WsF+WV/a7PETFW+cPxCQDgeNaRDYY7VRfxbRfFod0Vvy1mw+sD0wBaIgCA49kcuwBv5D6yp/71sQsCPDMNEI4kNYPfH7scr2wWEX2VP5weLQBwXOt4OT3uHHyJ7Kn/7tgFAfIJAOC4VnFeAcCnyFYd3By7IEA58zc6yjTA8zGaLB8iG3DXxG1kswmOuZ7Amy8uxOkwDbC7tADA8a3igFaAxWw4SAvvTCNbfKfOtLym7iMr99zTPnST0K2jtACcj9FkOYiIPw5I4q/bfe1bq/AN0k/T1oVtj5GNV1hHxFqlzxMtAN3lynWUAOC8jCbLu2j+5P73xWx4U5J2P7IFe57+20sv9XbyfOpOiMimKD7E88qAdw3LxpkTAHSXK9dRAoDzknbq+73h6feL2bDXXmmgOgFAd1kHAE7AYjacR/M1AT4ce6tfoHsEAHA6rg84d9xSGYB3QttNR+kCOE+jyXIT+dvnVvHzYjZctVca2E8XQHdpAYDTMj3g3JvRZHnZUjmAMycAgBOS1syfNTz9QxwWQADviAAATs91NB8Q+Gua9gdQSgAAJyYtpzs+IImVrgBgHwEAnKDUFfD3hqd/iIh5a4UBzpIAAE5UWt3vU8PTfxpNlvP2SgOcGwEAnLZpZEv0NvFxNFlO2ysKcE5M4Owo6wC8H6k/fx3N1wf4Ja00CK2zDkB3aQGAE5cGBQ6ieUvA76PJ8rqt8gDnQejWUVoA3p8WWgI+LWbDcVvlgQgtAF3mynWUAOB9SkHAPCJ+apjEl4i4Sq0KcDABQHe5ch0lAHjfRpPlTURMGp7+GFkQsG6tQLxbAoDucuU6SgDAaLK8iqw14KJhErOIuNYawCEEAN3lynWUAICIiNFk2YssCPihYRL3ETHWGkBTAoDucuU6SgDAttFkOY6Im2jeGvA5IqaL2fCupSLxTggAusuV6ygBALvSAMFpRPx6QDKfIusWuGuhSLwDAoDucuU6SgBAkdQtcB0RHw9I5lNE3Cxmw00LReKMCQC6y5XrKAEA+2y1CIwj2yCoidvIxhistAqQRwDQXa5cRwkAqCPNGHj6aTpO4DayhYg2EXFn4CARAoAuc+U6SgBAU6PJsh9ZIDCIiH40DAgWs6H7BwKADnPlOkoAQFvSmIFeZMHAZfrp57z1IbKn/4iIzWI2XL1qwegEAUB3uXIdJQAAToEAoLvsBggA75AAAADeIQEAALxDfzl2AaBNae77VfpZL2bDmyMWp9DWSPxeZEvwPhyxOOxI36NxZDMl7iJbB2F9tALBKxAAvGOpErqM7Ca3axNp1PepV05blf4gvp3n/lNk6+OfhPR5jyMr4/bCPHeRrdzHCUjXaR3fTo+cjCbLXxaz4fwYZYLXIAB4R9J0r6vIKsqfapx3H9kNcXUqU79SpX8T2e/SdJW7V5cW4JnGAfPteXM3kX+tfh9NlmsrInIuBADvwGiyHERWCVWu9Hd8iGxd+Y8pGJieQCAwjcPWun8r/zx2AaguBZZlWytfxQm1KsEhDAI8Y6PJsjeaLNcR8UeUV/5f0s9thWQ/RMQ/R5PlzcEFPMxNZBvWnLpZRDweuxBU1tvz+uUblAHehBUcOmrfQkCjyXIaWb9yXlPmfWQVaO4GL1vrxu97wv7rsZtDR5PlOIqbbE9iudoK2/T+tpgNr9+qPJQbTZYPUdxd86PBgN+yEFB36QI4Q6PJch75lXel5vv0+io95c8j4vuCt17FkZtDF7PhPLVy/PuY5SiTBlFepzEYXei26JQ0aO8m/e9DRIwPHLg6jYjfc45/UflzTnQBnJHRZHk5miw3kV/JfI6Ifp2++7QX/CCKuwYuaxXwlaRWiCrdF8c2P3YBztQ8sn77HyLr6uofklga6f9zPH+nHiPit8gCXjgbWgDOyyryn9Y/LWbDcZMEF7PhQxpEuM5Ju98kzVfycOwC8PZS90pRC1VjT61gbacLp0QLwJlIzf55o5c/N638n6Tm1Lw0Lg9JF1rQP3YBoKsEAGcgDdor6vMft5FH6g7owqh73perYxcAukoA0HGpCXRe8PKhg6F2Xce3U9rWLaYNtWwt1ws0YAxA900jf8pS6yOWF7PhXZpe+DRCunH6aeR2L75twl1HxN2xpxbuSmMgevE8R/whsqWSX32Z5FTJ9ePb5ZrX0cLnlGYlDCLismjPhK339CL7vXOnjpbk0Y+sq+jpv0/WEfGQWpZqS5/LOt5gdcV0/QcRcXPo9U6fZy++vZ536afV71OVcqfy9OP57/AhlWPdVjk4XSZwdtTXr1+fboJ3kX8T/PkEVuv7RqoMpvHtev157iNr1ah8w01TAV+MgWi6DkCN1RNvIyvnvGKaf+S89GIdgIr5V857J+2reLnOw9+3g4CtpZZ3u5YeI5tKmpvn1lP5VZSvqLed3ioirqsEFqnCGkdx4BtR8N3fqnwj9lS2Bfs2NBpMm/Kdxss9IPLcRvbdnzcJBqqWO62fcV1SnsrXxToA3eXKdVQKAKYR8Y+cl+8Xs2HvbUtULN0Ab6L+UsSllc1OHutoIQDYmlNepfLadh9Zl8u6JO1B7AkAtrp06nxWtynvTUG+l/G8s90g8ivO7TL0o/zp+jEiersV1GiyvI7yinmf2WI2nBa9OJosV1Htc3mMrIUmImt1KJol8Lenz2xnn4xBFLeqDSrkHynNy8gPoqp4jCy4u66Qx1U8lzuvQv+z3Ok7OC94X1E5Sv8GBQDdZQxAt00Ljq/esAyl0tPmJvJv3F8iG1j4KfLn8V9EtgHL/JWK940UUP0rXlb+j5GVdRbZegr3Oad/iIg/0pNV0/z7kbXo1A2Uvo+IdTo/zzyyQPGn2FM5V6j8I7022DnvOrKVDsvOu43nZafzTEaT5SZVanmqfi4X8bwuQNkUwe181lHxM6oiVbR3kV/5b38Oed+lSGX4dTRZrks+j4js2v6e8imt1NN3849978spx++HfK85XcYAdFR6Yin6Q16/XUmKpZvG7opqj5E9Fb1o3i9pKfg4mizj0OmMZQpWTyx8+kk3+Jt4WcH8nsr64pw9+V9FdjNvWvlcRBYEDHJaAlZRofJMn/+6Yhn68W2gOS1572+xc71TpXYdEZOd934f2ec6rlCGQ222/n0d+av/1VbwvY/IPof5bpP6nhayH+L5uj7kvJ53rE6Zqvp9NFlumo7Z4DRpAeiuq5LX1m9UhkIllf9gMRte593MFrPh3WI2vIr86YYfUyXZurTk8W7lfxtZM/c875zU1D+IrEVg1026qVd1Fd9W/k8rz/11MRt+9/QT2ep0RU/Pkc5f7T4xpt/hrynNMttl2Gfz9I/UapB33mNkzewvrvdiNnxIzf15ZfqYAqxds3h+cv4SxZssPe68b7fV4T4iftkuU/qMfoziJ/JKSr73T5/D3e45W9/7XwqSfWrhucw5dxxZucum6Pbi5ZLdX1J+P6afn/ekETlp0HE6bzrqv/77f+dRMPf/2P3/Bc3IT5X/pmIa63jZFF/4uzUdA5CCit0te29TWR8qlPMysspwtzXmRX9xyRiA3byvygZelYz9eFK4uVDZuJH49nf4Elnrx2Zr8ObHrff2nz6fgt+r8vUu2Hznc6oUy867ivztlg8aAFsy1qB0DEAK+jbx8nepvIHQnif1fWMkrqN4w6knj5F9v3LLU6EL6G+719QYgO7SAtBdvYLjd29YhiLzeHkDua7ZfHidc+xDm32RJWsoVF4/Ib3vJuelH0r65Is8VZp3e/K8ieKnxYiIaVG/cdF0v/i28v+8mA3/rLwXs+EmPWn+NbKnxX6Fz2da43qvc479tKfvO6K4+bvoeFU3Dc+bx8vv/azOlLrUEpHXqhSRjZHol5x+syf5p+9XYXm29v8oUvYaHSMA6K7+sQuQJ1XQu/3i9yUVT66Sm9S0dqGK3cTLG/anBv2c64Lj45rp1Ak85lFcUVxEeRdRWTfCYxSUOzVVryuU8XPNMRCbguP9Gmm06aHuCak1Im/myHWD/MdR3L1RmF6F61I4U2QnnU0Udwf0951PdwgAuquoiW7zloXIcZ1z7KZhWnn9sa1s/FKyNe9Ng+TuCo4PaqRx26DZelry2lXNtJ40Wezmbuvfj1E/SBsUHL+smU4rGg50u8459qnJXP6SVqWIrGWkVzfNyILwVY33F723Sd6cKAHA+Xk4VsbpKShvZsKqQVqXBWlFwQCxusY5x+4b3vwHBcfrBCvzupmmroKiJ7W6UwkPLcfPkQ3o29uFsS1VZkVrLvTrluUYUrN83rVeH5DsvOS1q5bTy7NukAcdIwA4P70j5n2Vc+yx7pK1WwuovKZxzrG7uomkCuz6sKJERPO1GwrPazAG4bbp8sKL2XCVRrlvqp6TrvOqSX5Jv+B45TK05Krg+KZpguk65K2NEdGsH35dM/+HBnnQMdYBOD+9I+Z9lXcwTbN7qJjGILIbe9l0tKpp5UoVY17rQi+NpK7iMrJy1l0xMM/9IRXvaLIsevmyZnKbJmVoIgVOqzisS+cy7+ARKq9B3sEW5syvIv/zyc1vj80hBeE8CQC6a3fa1lGVzAW/iJeLvRzisYUba7/g+IfYP42qjqJBervuDsznS+QHIr2a6Rxajr3SU/80qi0ZvHnd0rSmjSAwz6bgeO3FojzRk0cXQHfdFRzvv2EZtvXeKJ9pC2n0Wkhjn8eo3jWwOTCvh4LjvZrprA8qRYnRZNlPqy3exf4lg588vFZ5OmJT9ELN7p2DFjfifGkB6K5N5D95XIwmy17TJuUD9AuOP0Y2AOnhwPQfouZWtCUGBceflik+1F1kZX2o+P6q7yuyieaD/l7N1gY70yhurZql/7bZSvRmWhqQmmuRbb9d9PJljaTuDi4MZ0kA0F2bktf6cTp/9Ht3NDshhSukddS65vsf2sg0rQUxjvKm8U+RtpqtMe4CaJEAoLtWUbxk6FWczo6AvWMXoIZBvOPpT4eOrUjTQG+i+Gn/PrLWoCZrDXTOK7fEPbxSurwjAoCOWsyGD6PJ8jbyRwlfvXFxyvSOXYB3bPMWmVTY9/4+sqf9ectZ91tOr7bFbLguaabvxyu1xNmVjzYYBNhtNwXHL46wf/ddwfH+G5ahqk3B8cEblqHNfPPOv3/Dp+xVFFf+s8j2DpiXnD9omO9l3sHX7Jevqf9K6RrURyu0AHTbKvLXs4/I+mDnr5FpGs39MbJBc71U0WwK3n4xmiz7J/bEcldw/LWmc+1z+Qrnrw9Ms5LUf1/0uf3yCk/9p6hoGuZVHLBIVMmSv5umacI2LQAdtmfN8B9eoxUg9fM+Pe1dRHrKSRV80QYmrZfjQOuiF47QchIR8X2Fne9ypfPyuoFWB5SnTt7TgpdnNSr/fgvFOaZNwfHvG67b/6RfcHx1QJrwJwFAx6UR9kVNgjdNK5Y8FZboXRccH7dZjkOlYKXoM7t+u5J8Y9DieY8NNhZq4iqK5/NfV0kgVZC1F7bZo99yevvMS14bH5DuoOD46oA0D9U7Yt60TABwHsYFxy+i3ZvFdZSvPjgvKUfRa5WMJsvegU9Tu+YFxz+MJsvpIQmnRW8ua542bpjdVc6xm4Zp1dUrOP6lxviDqwPyL8qjf0CatfdQ2BNQTg8Ifsc5xxrtMNiik1l9lMMJAM5Amrv+W8HLP6Q++4OkpvHSxVrSU2fRjfCnps3rqZ/53xGxqXtzLnn/vOS06wYb6cRosrxMn/W/ImJdM43a27wWbGnceDGjlgOsqqYHnLspOH51QJoRzcZkXBccv4gGv2P6W8lrGSnKp8xlg/xrn0P3CADOROoKKNoa9uNoslwd0M88juI1BzY7/z8tSer3OkFAeupfx/P6/BdRfHMvGoh2mXcwzc8uCpouomYFnt67jucK+fuo31w6r/n+m5xj1xWeEIs+q17N/Iv0q7wpBXaHPFE+FBy/KGvFGU2W49Fk+VDyXewVHO8XpZnGOxTt3vdrnZkJJV1tv5WtK1CSR5MNl/ol+fQapMcJEgCckcVsOI7y/eE3dadIpRtpUeV/u1vZpFaAojJEZEHAquwmkir+63i53HHu0+2e3+mq6IUUNBXdtC8i4l+jyfKmQlnnkT31b99obxv0w1durUmV1+7yv58Xs+HNnvP6JS9fVcl7y6bgeGkFnMoxjv0bL+0rz7rktX/sliFdq1Vk3+eLKG4pGRQcv9jz+Y1LXltVCShT5b+Ol0//XyqsqDkoSbfwtbpp7XmNDvnu2AWgma9fvxa+lirPspvrl4iYl43STqP9p1E+Ne7veRXO1k1s35PHbXrfQ/r/y8huLkXn/bi7VG+FvB4jYlA0DXHryX3fQLQv8W2F04vsKSkv38fI5r7f7eQ1iIg/9uQTkQVQ06In+YLrexvZ75l7zta56yi+pqWfVUF6d1H8FP/i+5GCqZv4NngpmkYXka0jcFcU2OzJPyL7nTaRfbd2r9VsMRtOd9LrRxbMFfmymA0HRS/uaS17jKyF5qbg3H5krUC75dx7bdPfwV0Uf49vF7Nhv+j8mmndR/b9foiI+O471UhXuXIdVRYARPxZ2cxjfxPrl8j+2O/S/w8iq9j2VYilN5QaQUAVjxEx3n2iLrlhVjp/J511tDMa/TbltcnJZxDVAoCI502UVlvHBpE9Ze5e0yoVRC+lt2+tg9LPKifdq4j45570Nunfl1FQuUXEf/Zk9aKyrph/kRefWWoxuI5qweC4qDl+TxAQkVWgq3gOfgeR/c3lbehU5dpeRXZt9/7NRrbfxV1JWoNUtn1p3Uf2GawFAN3lynXUvgDgSXpanEa7U61Kn1B38r+Jw3Z6y73Zpgrt3zXT+q2oGTUFLKs4bDGgfU/ug/g2APgtskrg+oB8P0f2+eTmmfLtRVYJ1/kO5LbuFKQ/jvIKr8ifZd9aXKpI2bXbd+6uvMr/Jup9T3NbebbS60e14LRMbtCzk89V1AuACsvdMJj6+X//579WNc/hRBgDcOYWs+H1Yja8jIhfIrvhNvUYWQX3t8VsWFrh7OQ/jYgfG+T9JSJ+XsyGg4Kb7EN6T1WPUdJnvJgNH1LT7s9RPC6gyOfIuif2fS7br92na7NO+f5YM98vKc+rCtfiIeqtHncfNVYSTF1JP0b1JWrvI1slcLvs0yheSOpTWf93GvtSNKBz22NkgUQ/5zNbl+SfZxMlG/IsZsNNaiH7Jeov3fv0dzat8N67mulvorjcddO6j9PZdZQGtAB0VNUWgF3pSXcQWZNjP7Jm2ct4flLZbrK9S//etLFN7uh5f/h+PPehX2zl+RDZjXhVdRe1GoObNnXmT6cnuEH6uYznJ/Snm95dPJe1TrrryH7v3L72lO/VVr5P1+U2vv18XpxbIe9BxbfW+qx28riKb79fF/H8mW0iYl3SFXMZ2fiAQWTdHHvHquyc34sskNjO+zblvYo91yrl36+SV92/h5zv01P5nr77d5Fd23XdHQTbLHedtCJ9T3QBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8H78H8cG90XPoPG9AAAAAElFTkSuQmCC";

// ── EMAILJS ───────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE  = "service_61m7n0f";
const EMAILJS_TEMPLATE = "template_2df0v4v";
const EMAILJS_KEY      = "njhN8mN77cVNwY4dJ";

async function sendWelcomeEmail({ toName, toEmail, password, role, branch, appUrl }) {
  if (!EMAILJS_SERVICE || EMAILJS_SERVICE === "YOUR_SERVICE_ID") return { ok: false, reason: "not configured" };
  try {
    // EmailJS SDK approach — loads their script then sends
    const payload = {
      service_id:      EMAILJS_SERVICE,
      template_id:     EMAILJS_TEMPLATE,
      user_id:         EMAILJS_KEY,
      accessToken:     EMAILJS_KEY,
      template_params: {
        to_name:        toName,
        to_email:       toEmail,
        login_email:    toEmail,
        login_password: password,
        role:           role === "admin" ? "Administrator" : role === "viewer" ? "Viewer" : "Data Capturer",
        branch:         branch || "All Branches",
        app_url:        appUrl || window.location.origin,
      },
    };
    // Try proxy first, fall back to direct
    let res;
    try {
      res = await fetch("/emailjs/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "origin": window.location.origin },
        body: JSON.stringify(payload),
      });
    } catch(_) {
      res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    const text = await res.text();
    console.log("EmailJS:", res.status, text);
    return res.ok ? { ok: true } : { ok: false, reason: `${res.status}: ${text}` };
  } catch (e) {
    console.error("EmailJS error:", e);
    return { ok: false, reason: e.message };
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const totalAttendance = s => s.attendance.adults + s.attendance.vip + s.attendance.children;
const totalOfferings  = s =>
  (s.offerings.tithe || 0) + (s.offerings.offering || 0) + (s.offerings.firstFruit || 0) +
  (s.offerings.compassion || 0) + (s.offerings.special?.amount || 0) + (s.offerings.other?.amount || 0);

const fmt$ = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = (a, b) => b === 0 ? null : (((a - b) / b) * 100).toFixed(1);

const Arrow = ({ val }) => val === null ? null : (
  <span style={{ color: val >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: 12 }}>
    {val >= 0 ? "▲" : "▼"} {Math.abs(val)}%
  </span>
);

// ── THEME ─────────────────────────────────────────────────────────────────────
const C = { blue: "#4A6FA5", blueDark: "#2d4a73", blueLight: "#6B8DBB", bluePale: "#E8EFF8", accent: "#F0B429", bg: "#F5F7FA", card: "#FFFFFF", border: "#DDE3ED", text: "#1a2744", muted: "#6B7FA3" };

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Lato',sans-serif; background:${C.bg}; color:${C.text}; }
  h1,h2,h3,h4 { font-family:'Nunito',sans-serif; }
  input,select,textarea { font-family:'Lato',sans-serif; }
  ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#f0f0f0}
  ::-webkit-scrollbar-thumb{background:${C.blueLight};border-radius:3px}
  .fade-in{animation:fadeIn .3s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media(max-width:768px){
    .app-shell{flex-direction:column!important}
    .sidebar{width:100%!important;min-height:auto!important;flex-direction:column!important;position:sticky;top:0;z-index:100}
    .sidebar-logo{padding:10px 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
    .sidebar-logo img{height:36px!important}
    .sidebar-nav{display:flex!important;flex-direction:row!important;overflow-x:auto;padding:0!important;flex-wrap:nowrap;border-top:1px solid rgba(255,255,255,0.1)}
    .sidebar-nav button{padding:12px 14px!important;font-size:12px!important;border-left:none!important;border-bottom:3px solid transparent!important;white-space:nowrap;flex-shrink:0;min-width:80px;justify-content:center!important;flex-direction:column!important;gap:3px!important;align-items:center!important}
    .sidebar-footer{display:none!important}
    .main-content{padding:14px!important;max-height:none!important;overflow-y:visible!important}
    .entry-grid{grid-template-columns:1fr!important}
    .dash-grid-2{grid-template-columns:1fr!important}
    .kpi-strip{flex-direction:column!important}
    h2{font-size:18px!important}
  }
`;

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px", boxShadow: "0 2px 8px rgba(74,111,165,.07)", ...style }}>{children}</div>
);
const StatBox = ({ label, value, prev, accent }) => {
  const p = pct(value, prev);
  return (
    <div style={{ background: accent ? C.blue : C.card, border: `1px solid ${accent ? C.blue : C.border}`, borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: accent ? "rgba(255,255,255,.75)" : C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent ? "#fff" : C.text, fontFamily: "Nunito" }}>{typeof value === "number" && value > 999 ? fmt$(value) : value}</div>
      {prev !== undefined && <div style={{ marginTop: 4 }}><Arrow val={p} /></div>}
    </div>
  );
};
const Input = ({ label, value, onChange, type = "text", style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
    {label && <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", background: "#fff" }}
      onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = C.border} />
  </div>
);
const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
    {label && <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", background: "#fff", cursor: "pointer" }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);
const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }) => {
  const v = { primary: { background: C.blue, color: "#fff" }, secondary: { background: C.bluePale, color: C.blue }, danger: { background: "#fee2e2", color: "#dc2626" }, success: { background: "#dcfce7", color: "#16a34a" } };
  return <button style={{ border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "Lato,sans-serif", opacity: disabled ? .6 : 1, ...v[variant], ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
};
const Badge = ({ children, color = C.blue }) => (
  <span style={{ background: color + "20", color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{children}</span>
);
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, borderBottom: `2px solid ${C.bluePale}`, paddingBottom: 6, marginBottom: 12 }}>{children}</div>
);
const Alert = ({ msg, type = "success" }) => {
  if (!msg) return null;
  const colors = { success: ["#f0fdf4", "#22c55e", "#15803d"], error: ["#fef2f2", "#ef4444", "#dc2626"], info: ["#eff6ff", "#3b82f6", "#1d4ed8"], warn: ["#fffbeb", "#f59e0b", "#92400e"] };
  const [bg, border, text] = colors[type];
  return <div style={{ background: bg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>{msg}</div>;
};

// ── LOADING SCREEN ────────────────────────────────────────────────────────────
const Loader = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.blueDark, flexDirection: "column", gap: 20 }}>
    <img src={LOGO} alt="Celebration Churches International" style={{ height: 80, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: 8 }} />
    <div style={{ color: "rgba(255,255,255,.7)", fontSize: 14 }}>Loading Celebration Churches International Portal…</div>
    <div style={{ width: 200, height: 3, background: "rgba(255,255,255,.1)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", background: C.accent, borderRadius: 2, animation: "load 1.5s ease-in-out infinite" }} />
    </div>
    <style>{`@keyframes load{0%{width:0}100%{width:100%}}`}</style>
  </div>
);

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    if (!resetEmail.trim()) { setResetMsg("Please enter your email address."); return; }
    setResetLoading(true);
    try {
      const data = await db.get("cc_users", `email=eq.${encodeURIComponent(resetEmail.trim().toLowerCase())}&limit=1`);
      if (!data.length) { setResetMsg("No account found with that email."); setResetLoading(false); return; }
      const u = data[0];
      const emailPayload = {
        service_id: EMAILJS_SERVICE, template_id: EMAILJS_TEMPLATE, user_id: EMAILJS_KEY, accessToken: EMAILJS_KEY,
        template_params: { to_name: u.name, to_email: u.email, login_email: u.email, login_password: u.password, role: u.role === "admin" ? "Administrator" : u.role === "viewer" ? "Viewer" : "Data Capturer", branch: u.branch || "All Branches", app_url: window.location.origin },
      };
      let res;
      try { res = await fetch("/emailjs/api/v1.0/email/send", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(emailPayload) }); }
      catch(_) { res = await fetch("https://api.emailjs.com/api/v1.0/email/send", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(emailPayload) }); }
      if (res.ok) { setResetMsg("✅ Password sent to your email!"); }
      else { setResetMsg("❌ Could not send email. Please contact your admin."); }
    } catch(e) { setResetMsg("❌ " + e.message); }
    setResetLoading(false);
  };

  const handle = async () => {
    setLoading(true); setErr("");
    const ok = await onLogin(email.trim(), password.trim());
    if (!ok) { setErr("Invalid email or password."); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(150deg,${C.blueDark} 0%,${C.blue} 55%,${C.blueLight} 100%)`, display: "flex", alignItems: "stretch" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 48px", textAlign: "center" }}>
        <img src={LOGO} alt="Celebration Churches International" style={{ height: 140, marginBottom: 32, background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: "16px 24px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }} className="fade-in" />
        <h1 style={{ fontFamily: "Nunito,sans-serif", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>Celebration Churches International</h1>
        <div style={{ width: 60, height: 3, background: C.accent, borderRadius: 2, marginBottom: 20 }} />
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", fontStyle: "italic", lineHeight: 1.7, maxWidth: 340 }}>
          "Building People, Building Dreams,<br />Building the Kingdom of God"
        </p>
        <div style={{ marginTop: 48, padding: "12px 24px", background: "rgba(255,255,255,0.1)", borderRadius: 30, border: "1px solid rgba(255,255,255,0.2)" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Statistics Portal</span>
        </div>
      </div>
      <div style={{ width: 420, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 44px", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>
        <div className="fade-in" style={{ width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <img src={LOGO} alt="" style={{ height: 60, marginBottom: 12 }} />
            <h2 style={{ fontFamily: "Nunito,sans-serif", fontSize: 20, fontWeight: 900, color: C.blueDark, marginBottom: 4 }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: C.muted }}>Sign in to your account</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email Address" value={email} onChange={setEmail} type="email" />
            <Input label="Password" value={password} onChange={setPassword} type="password" />
            {err && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>{err}</div>}
            <Btn onClick={handle} disabled={loading} style={{ marginTop: 8, padding: "13px", fontSize: 15, borderRadius: 10, background: C.blueDark }}>
              {loading ? "Signing in…" : "Sign In →"}
            </Btn>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button onClick={() => setShowReset(true)} style={{ background: "none", border: "none", color: C.blue, fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "Lato,sans-serif" }}>
                Forgot password? Request reset
              </button>
            </div>
          </div>
        </div>
      </div>
      {showReset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 36, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontFamily: "Nunito,sans-serif", fontSize: 18, fontWeight: 900, color: C.blueDark, marginBottom: 6 }}>Reset Password</h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Enter your email and we'll send your password.</p>
            <Input label="Your Email Address" value={resetEmail} onChange={setResetEmail} type="email" />
            {resetMsg && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: resetMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: resetMsg.startsWith("✅") ? "#15803d" : "#dc2626", fontSize: 13, fontWeight: 600 }}>{resetMsg}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn onClick={handleReset} disabled={resetLoading} style={{ flex: 1 }}>{resetLoading ? "Sending…" : "Send Password"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowReset(false); setResetMsg(""); setResetEmail(""); }} style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout }) {
  const isAdmin  = user.role === "admin";
  const isViewer = user.role === "viewer";
  const canView  = isAdmin || isViewer;
  const links = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    ...(!isViewer ? [{ id: "entry", icon: "✏️", label: "Enter Stats" }] : []),
    ...(canView ? [
      { id: "consolidated", icon: "🌍", label: "All Branches" },
      { id: "cells-dashboard", icon: "🔵", label: "Cells View" },
      { id: "reports", icon: "📈", label: "Reports" },
    ] : []),
    ...(isAdmin ? [{ id: "admin", icon: "⚙️", label: "Admin Portal" }] : []),
    { id: "profile", icon: "🔑", label: "My Profile" },
  ];
  return (
    <div className="sidebar" style={{ width: 220, background: C.blueDark, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div className="sidebar-logo" style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
        <img src={LOGO} alt="" style={{ height: 44, background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: "6px 10px" }} />
        <div style={{ fontSize: 10, color: C.accent, fontStyle: "italic", marginTop: 8, lineHeight: 1.5 }}>Building People,<br />Building Dreams,<br />Building the Kingdom of God</div>
      </div>
      <nav className="sidebar-nav" style={{ flex: 1, padding: "12px 0" }}>
        {links.map(l => (
          <button key={l.id} onClick={() => setPage(l.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 20px", background: page === l.id ? "rgba(255,255,255,.12)" : "transparent", border: "none", color: page === l.id ? "#fff" : "rgba(255,255,255,.65)", fontWeight: page === l.id ? 700 : 400, fontSize: 14, cursor: "pointer", borderLeft: page === l.id ? `3px solid ${C.accent}` : "3px solid transparent", fontFamily: "Lato,sans-serif" }}>
            <span>{l.icon}</span>{l.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer" style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 2 }}>{user.role === "admin" ? "Administrator" : "Data Capturer"}</div>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 10 }}>{user.name}</div>
        {user.cell   && <div style={{ fontSize: 11, color: C.accent, marginBottom: 10 }}>🔵 {user.cell}</div>}
        {!user.cell && user.branch && <div style={{ fontSize: 11, color: C.accent, marginBottom: 10 }}>🏛️ {user.branch}</div>}
        <Btn variant="secondary" onClick={onLogout} style={{ width: "100%", fontSize: 12, background: "rgba(255,255,255,.1)", color: "#fff" }}>Sign Out</Btn>
      </div>
    </div>
  );
}

// ── STAT ENTRY ────────────────────────────────────────────────────────────────
const EMPTY_FORM = { adults: "", vip: "", children: "", salvations: "", rededications: "", tithe: "", offering: "", firstFruit: "", compassion: "", specialLabel: "", specialAmt: "", otherLabel: "", otherAmt: "", highlights: "" };

function EntryPage({ user, branches, cells, onSaved }) {
  const today = new Date().toISOString().split("T")[0];
  // If user has a cell, branch must be empty regardless of what DB has
  const [branch, setBranch] = useState(user.cell ? "" : (user.branch || ""));
  const [cell,   setCell]   = useState(user.cell || "");
  const [date, setDate]     = useState(today);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [err, setErr]       = useState("");

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const n   = k => Number(form[k]) || 0;
  const totalAtt = n("adults") + n("vip") + n("children");
  const totalOff = n("tithe") + n("offering") + n("firstFruit") + n("compassion") + n("specialAmt") + n("otherAmt");

  const submit = async () => {
    if (!branch) { setErr("Please select a branch."); return; }
    setSaving(true); setErr("");
    const selBranchObj = branches.find(b => b.name === branch) || {};
    const selCellObj   = cells.find(cl => cl.name === cell) || {};
    // For cell capturers, use cell as the primary key
    const effectiveBranch = user.cell ? null : (branch || user.branch);
    const effectiveCell   = user.cell || cell || null;
    const entry = {
      id: `${effectiveBranch||"cell"}-${effectiveCell||"main"}-${date}`,
      branch: effectiveBranch, cell: effectiveCell,
      district: selBranchObj.district || selCellObj.district || null,
      date,
      attendance: { adults: n("adults"), vip: n("vip"), children: n("children") },
      alter_call: { salvations: n("salvations"), rededications: n("rededications") },
      offerings: { tithe: n("tithe"), offering: n("offering"), firstFruit: n("firstFruit"), compassion: n("compassion"), special: { label: form.specialLabel, amount: n("specialAmt") }, other: { label: form.otherLabel, amount: n("otherAmt") } },
      highlights: form.highlights,
    };
    try {
      await db.upsert("cc_stats", entry);
      setForm(EMPTY_FORM); setDate(today);
      setSaved(true); setTimeout(() => setSaved(false), 4000);
      onSaved(); // refresh parent stats
    } catch (e) { setErr("Save failed: " + e.message); }
    setSaving(false);
  };

  const row3 = children => <div className="entry-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{children}</div>;

  return (
    <div className="fade-in" style={{ maxWidth: 780, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Enter Service Statistics</h2>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Record attendance, altar call results and offerings.</p>
      {saved && <Alert msg="✅ Statistics saved to the database! Form cleared for next entry." type="success" />}
      {err   && <Alert msg={err} type="error" />}

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Service Details</SectionTitle>
        <div className="entry-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Branch / Cell assignment display */}
          {user.role === "admin" ? (
            /* Admin: full branch selector grouped by district */
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Branch *</label>
              <select value={branch} onChange={e => { setBranch(e.target.value); setCell(""); }}
                style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "Lato,sans-serif", background: "#fff" }}>
                <option value="">— Select Branch —</option>
                {[...new Set((branches||[]).map(b => b.district || "Unassigned"))].map(dist => (
                  <optgroup key={dist} label={"🗺️ " + dist}>
                    {(branches||[]).filter(b => (b.district || "Unassigned") === dist).map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : user.cell ? (
            /* Cell capturer — show their cell only (cell takes priority over branch */
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Cell</label>
              <div style={{ padding: "12px 14px", border: `2px solid ${C.blue}`, borderRadius: 8, fontSize: 14, background: C.bluePale, fontWeight: 700, color: C.blue }}>🔵 {user.cell}</div>
            </div>
          ) : (
            /* Branch capturer — show their branch, no selector */
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Branch</label>
              <div style={{ padding: "12px 14px", border: `2px solid ${C.blue}`, borderRadius: 8, fontSize: 14, background: C.bluePale, fontWeight: 700, color: C.blue }}>🏛️ {user.branch}</div>
            </div>
          )}
          {/* Cell selector — only shown for admin (capturers see their assignment above) */}
          {user.role === "admin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Cell (optional)</label>
            <select value={cell} onChange={e => setCell(e.target.value)}
              style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "Lato,sans-serif", background: "#fff" }}>
              <option value="">— No Cell —</option>
              {(() => {
                const branchDist = ((branches||[]).find(b => b.name === branch) || {}).district;
                const filtered   = branchDist ? (cells||[]).filter(cl => cl.district === branchDist) : (cells||[]);
                const dists      = [...new Set(filtered.map(cl => cl.district || "Unassigned"))];
                return dists.map(dist => (
                  <optgroup key={dist} label={"🗺️ " + dist}>
                    {filtered.filter(cl => (cl.district || "Unassigned") === dist).map(cl => (
                      <option key={cl.name} value={cl.name}>{cl.name}</option>
                    ))}
                  </optgroup>
                ));
              })()}
            </select>
          </div>
          )}
          {/* Date */}
          <Input label="Service Date" value={date} onChange={setDate} type="date" />
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Attendance</SectionTitle>
        {row3([
          <Input key="a" label="Adults"   value={form.adults}   onChange={v => upd("adults", v)}   type="number" />,
          <Input key="b" label="VIP"      value={form.vip}      onChange={v => upd("vip", v)}      type="number" />,
          <Input key="c" label="Children" value={form.children} onChange={v => upd("children", v)} type="number" />,
        ])}
        <div style={{ marginTop: 12, padding: "10px 14px", background: C.bluePale, borderRadius: 8, fontSize: 14, fontWeight: 700, color: C.blue }}>
          Total: <span style={{ fontSize: 18 }}>{totalAtt}</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Altar Call</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Salvations"     value={form.salvations}    onChange={v => upd("salvations", v)}    type="number" />
          <Input label="Re-dedications" value={form.rededications} onChange={v => upd("rededications", v)} type="number" />
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Offerings</SectionTitle>
        {row3([
          <Input key="t" label="Tithe ($)"       value={form.tithe}      onChange={v => upd("tithe", v)}      type="number" />,
          <Input key="o" label="Offering ($)"    value={form.offering}   onChange={v => upd("offering", v)}   type="number" />,
          <Input key="f" label="First Fruit ($)" value={form.firstFruit} onChange={v => upd("firstFruit", v)} type="number" />,
        ])}
        <div style={{ marginTop: 12 }}><Input label="Compassion ($)" value={form.compassion} onChange={v => upd("compassion", v)} type="number" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
          <Input label="Special Offering (label)" value={form.specialLabel} onChange={v => upd("specialLabel", v)} />
          <Input label="Amount ($)" value={form.specialAmt} onChange={v => upd("specialAmt", v)} type="number" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
          <Input label="Other (label)" value={form.otherLabel} onChange={v => upd("otherLabel", v)} />
          <Input label="Amount ($)" value={form.otherAmt} onChange={v => upd("otherAmt", v)} type="number" />
        </div>
        <div style={{ marginTop: 14, padding: "10px 14px", background: C.bluePale, borderRadius: 8, fontSize: 14, fontWeight: 700, color: C.blue }}>
          Total Offerings: <span style={{ fontSize: 18 }}>{fmt$(totalOff)}</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Key Highlights</SectionTitle>
        <textarea value={form.highlights} onChange={e => upd("highlights", e.target.value)}
          placeholder="Notable moments, special guests, testimonies..."
          style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, minHeight: 90, resize: "vertical", fontFamily: "Lato,sans-serif" }} />
      </Card>

      <Btn onClick={submit} disabled={saving || !branch} style={{ padding: "12px 32px", fontSize: 15 }}>
        {saving ? "Saving…" : "Save Statistics"}
      </Btn>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage({ user, stats, branches, cells, districts }) {
  const [selBranch,   setSelBranch]   = useState("");
  const [selCell,     setSelCell]     = useState("");
  const [selDate,     setSelDate]     = useState("");
  const [dashView,    setDashView]    = useState("branches"); // "branches" | "cells"
  const [selDistrict, setSelDistrict] = useState("");

  // 1. All dates across all stats (for dropdown)
  const allDates = [...new Set(stats.map(s => s.date))].sort().reverse();

  // 2. Default to latest available date
  const activeDate = selDate || allDates[0] || "";

  // 3. Filter stats to the active date
  const statsForDate = stats.filter(s => s.date === activeDate);

  // 4. Role-based scoping
  const isAdmin      = user.role === "admin";
  const isViewer     = user.role === "viewer";
  const isCapturer   = user.role === "capturer";
  const userIsCell   = isCapturer && !!user.cell;                   // cell takes priority
  const userIsBranch = isCapturer && !!user.branch && !user.cell;  // branch capturer (no cell)
  const viewBranches = isViewer ? (() => { try { return JSON.parse(user.view_branches||"[]"); } catch { return []; } })() : [];
  const viewCells_   = isViewer ? (() => { try { return JSON.parse(user.view_cells||"[]"); } catch { return []; } })() : [];

  // activeBranch/Cell: what admin/viewer has selected in the filter
  const activeBranch = (isAdmin||isViewer) ? selBranch : (userIsBranch ? user.branch : "");
  const activeCell   = (isAdmin||isViewer) ? selCell : (userIsCell ? user.cell : "");

  // Scope stats based on role
  const filteredStats = (() => {
    if (isCapturer) {
      // capturer sees ONLY their assigned branch OR cell
      if (userIsCell)   return statsForDate.filter(s => s.cell   === user.cell);
      if (userIsBranch) return statsForDate.filter(s => s.branch === user.branch);
      return statsForDate.filter(s => s.branch === user.branch); // fallback
    }
    if (isViewer) {
      const base = statsForDate.filter(s =>
        (viewBranches.length===0 || viewBranches.includes(s.branch)) &&
        (viewCells_.length===0   || !s.cell || viewCells_.includes(s.cell))
      );
      if (activeCell)   return base.filter(s => s.cell   === activeCell);
      if (activeBranch) return base.filter(s => s.branch === activeBranch);
      return base;
    }
    // admin/viewer — filter by district → then branch or cell based on dashView
    const districtBase = selDistrict ? statsForDate.filter(s => s.district === selDistrict) : statsForDate;
    if (dashView === "cells") {
      if (activeCell)   return districtBase.filter(s => s.cell === activeCell);
      return districtBase.filter(s => !!s.cell);
    }
    if (activeBranch) return districtBase.filter(s => s.branch === activeBranch);
    return districtBase.filter(s => !s.cell);
  })();

  // 5. Sum everything in filteredStats → these are the KPI totals
  const totals = filteredStats.reduce((acc, s) => {
    const ac = s.alter_call || s.alterCall || {};
    return {
      adults:        acc.adults        + (s.attendance.adults    || 0),
      vip:           acc.vip           + (s.attendance.vip       || 0),
      children:      acc.children      + (s.attendance.children  || 0),
      salvations:    acc.salvations    + (ac.salvations           || 0),
      rededications: acc.rededications + (ac.rededications        || 0),
      offerings:     acc.offerings     + totalOfferings(s),
    };
  }, { adults: 0, vip: 0, children: 0, salvations: 0, rededications: 0, offerings: 0 });

  const totalAtt = totals.adults + totals.vip + totals.children;

  // 6. Previous date totals for comparison arrows
  const prevDate   = allDates[allDates.indexOf(activeDate) + 1] || "";
  const prevStats  = prevDate
    ? stats.filter(s => {
        if (s.date !== prevDate) return false;
        if (isCapturer) return userIsCell ? s.cell === user.cell : s.branch === user.branch;
        if (selDistrict && s.district !== selDistrict) return false;
        if (dashView === "cells") return selCell ? s.cell === selCell : !!s.cell;
        return selBranch ? s.branch === selBranch : !s.cell;
      })
    : [];
  const prevTotals = prevStats.reduce((acc, s) => {
    const ac = s.alter_call || s.alterCall || {};
    return {
      adults:     acc.adults     + (s.attendance.adults   || 0),
      vip:        acc.vip        + (s.attendance.vip      || 0),
      children:   acc.children   + (s.attendance.children || 0),
      salvations: acc.salvations + (ac.salvations          || 0),
      offerings:  acc.offerings  + totalOfferings(s),
    };
  }, { adults: 0, vip: 0, children: 0, salvations: 0, offerings: 0 });
  const prevTotalAtt = prevTotals.adults + prevTotals.vip + prevTotals.children;
  const hasPrev = prevStats.length > 0;

  // 7. Trend chart — last 10 dates, summed per date for the active branch filter
  const trendDates = allDates.slice(0, 10).reverse();
  const chartData  = trendDates.map(d => {
    const ds = stats.filter(s => {
      if (s.date !== d) return false;
      if (isCapturer) return userIsCell ? s.cell === user.cell : s.branch === user.branch;
      if (selDistrict && s.district !== selDistrict) return false;
      if (dashView === "cells") return selCell ? s.cell === selCell : !!s.cell;
      return selBranch ? s.branch === selBranch : !s.cell;
    });
    const sum = ds.reduce((a, s) => {
      const ac = s.alter_call || s.alterCall || {};
      return {
        adults:   a.adults   + (s.attendance.adults   || 0),
        children: a.children + (s.attendance.children || 0),
        vip:      a.vip      + (s.attendance.vip      || 0),
        total:    a.total    + totalOfferings(s),
        tithe:    a.tithe    + (s.offerings.tithe     || 0),
      };
    }, { adults: 0, children: 0, vip: 0, total: 0, tithe: 0 });
    return { date: d.slice(5), Adults: sum.adults, Children: sum.children, VIP: sum.vip, Total: sum.total, Tithe: sum.tithe };
  });

  const PIE_COLORS = [C.blue, C.accent, C.blueLight];
  const pieData = [
    { name: "Adults",   value: totals.adults },
    { name: "VIP",      value: totals.vip },
    { name: "Children", value: totals.children },
  ];

  if (!activeDate) return (
    <Card><p style={{ color: C.muted, padding: "12px 0" }}>No stats recorded yet. Use "Enter Stats" to add your first service.</p></Card>
  );

  return (
    <div className="fade-in">
      {/* Header + Filters */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900 }}>
            {isCapturer
              ? (userIsCell ? `🔵 ${user.cell}` : `🏛️ ${user.branch}`)
              : selDistrict
                ? `🗺️ ${selDistrict} · ${dashView==="cells" ? (selCell||"All Cells") : (selBranch||"All Branches")}`
                : dashView==="cells"
                  ? (selCell ? `🔵 ${selCell}` : "All Cells")
                  : (selBranch ? `🏛️ ${selBranch}` : "All Branches")} Dashboard
          </h2>
          <p style={{ color:C.muted, fontSize:13 }}>
            Date: <strong>{activeDate}</strong>
            {hasPrev && <span style={{ marginLeft:8, color:C.muted }}>· prev: {prevDate}</span>}
          </p>
        </div>
        {/* Filters — admin/viewer only */}
        {(isAdmin || isViewer) && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {/* Branches / Cells toggle */}
            <div style={{ display:"flex", gap:6 }}>
              {[{id:"branches",label:"🏛️ Branches"},{id:"cells",label:"🔵 Cells"}].map(t=>(
                <button key={t.id} onClick={()=>{ setDashView(t.id); setSelBranch(""); setSelCell(""); setSelDistrict(""); }}
                  style={{ padding:"7px 14px", borderRadius:8, border:`2px solid ${dashView===t.id?C.blue:C.border}`, background:dashView===t.id?C.blue:"#fff", color:dashView===t.id?"#fff":C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"Lato,sans-serif", whiteSpace:"nowrap" }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* District filter */}
            {(districts||[]).length > 0 && (
              <select value={selDistrict} onChange={e=>{ setSelDistrict(e.target.value); setSelBranch(""); setSelCell(""); }}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
                <option value="">All Districts</option>
                {(districts||[]).map(d=>(
                  <option key={d.name} value={d.name}>🗺️ {d.name}</option>
                ))}
              </select>
            )}
            {/* Branch selector — filtered by selDistrict if set */}
            {dashView === "branches" && (
              <select value={selBranch} onChange={e=>{ setSelBranch(e.target.value); setSelCell(""); }}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
                <option value="">All Branches</option>
                {(branches||[])
                  .filter(b => !selDistrict || b.district === selDistrict)
                  .map(b=>( <option key={b.name||b} value={b.name||b}>{b.name||b}</option> ))
                }
              </select>
            )}
            {/* Cell selector — filtered by selDistrict if set */}
            {dashView === "cells" && (
              <select value={selCell} onChange={e=>{ setSelCell(e.target.value); setSelBranch(""); }}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
                <option value="">All Cells</option>
                {(cells||[])
                  .filter(cl => !selDistrict || cl.district === selDistrict)
                  .map(cl=>( <option key={cl.name} value={cl.name}>{cl.name}</option> ))
                }
              </select>
            )}
            {/* Date */}
            <Select value={selDate} onChange={setSelDate}
              options={[{ value:"", label:"Latest Date" }, ...allDates.map(d=>({ value:d, label:d }))]} />
          </div>
        )}
        {isCapturer && (
          <Select value={selDate} onChange={setSelDate}
            options={[{ value:"", label:"Latest Date" }, ...allDates.map(d=>({ value:d, label:d }))]} />
        )}
      </div>

      {/* KPI Strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatBox label="Total Attendance" value={totalAtt}         prev={hasPrev ? prevTotalAtt         : undefined} accent />
        <StatBox label="Adults"           value={totals.adults}    prev={hasPrev ? prevTotals.adults    : undefined} />
        <StatBox label="VIP"              value={totals.vip}       prev={hasPrev ? prevTotals.vip       : undefined} />
        <StatBox label="Children"         value={totals.children}  prev={hasPrev ? prevTotals.children  : undefined} />
        <StatBox label="Salvations"       value={totals.salvations} prev={hasPrev ? prevTotals.salvations : undefined} />
        <StatBox label="Total Offerings"  value={totals.offerings} prev={hasPrev ? prevTotals.offerings : undefined} />
      </div>

      {/* Comparison + Pie */}
      <div className="dash-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <SectionTitle>vs Previous Service {hasPrev && `(${prevDate})`}</SectionTitle>
          {hasPrev ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Metric","This Week","Last Week","Δ"].map(h =>
                <th key={h} style={{ textAlign:"left", padding:"4px 8px", color:C.muted, fontWeight:700, fontSize:11 }}>{h}</th>
              )}</tr></thead>
              <tbody>
                {[
                  ["Total Attendance", totalAtt,           prevTotalAtt],
                  ["Adults",           totals.adults,      prevTotals.adults],
                  ["Children",         totals.children,    prevTotals.children],
                  ["Salvations",       totals.salvations,  prevTotals.salvations],
                  ["Offerings",        fmt$(totals.offerings), fmt$(prevTotals.offerings)],
                ].map(([m,a,b]) => (
                  <tr key={m} style={{ borderTop:`1px solid ${C.border}` }}>
                    <td style={{ padding:"7px 8px", fontWeight:600 }}>{m}</td>
                    <td style={{ padding:"7px 8px", color:C.blue, fontWeight:700 }}>{a}</td>
                    <td style={{ padding:"7px 8px", color:C.muted }}>{b}</td>
                    <td style={{ padding:"7px 8px" }}><Arrow val={pct(Number(String(a).replace(/[$,]/g,"")), Number(String(b).replace(/[$,]/g,"")))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color:C.muted, fontSize:13 }}>No previous service data to compare.</p>}
        </Card>
        <Card>
          <SectionTitle>Attendance Breakdown — {activeDate}</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70}
                label={({name,percent}) => percent > 0 ? `${name} ${(percent*100).toFixed(0)}%` : ""}
                labelLine={false} fontSize={11}>
                {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%3]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trend Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Attendance Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:C.muted }} />
              <YAxis tick={{ fontSize:11, fill:C.muted }} />
              <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} />
              <Bar dataKey="Adults"   fill={C.blue}      radius={[4,4,0,0]} />
              <Bar dataKey="Children" fill={C.blueLight} radius={[4,4,0,0]} />
              <Bar dataKey="VIP"      fill={C.accent}    radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Offerings Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:C.muted }} />
              <YAxis tick={{ fontSize:11, fill:C.muted }} />
              <Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} formatter={v=>fmt$(v)} />
              <Line type="monotone" dataKey="Total" stroke={C.blue}   strokeWidth={2.5} dot={{r:4}} />
              <Line type="monotone" dataKey="Tithe" stroke={C.accent} strokeWidth={2}   dot={{r:3}} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Branch breakdown table — only when All Branches selected */}
      {isAdmin && !activeBranch && (
        <Card>
          <SectionTitle>Branch Breakdown — {activeDate}</SectionTitle>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:C.bluePale }}>
                {["Branch","Adults","VIP","Children","Total Att.","Salvations","Re-ded.","Offerings"].map(h => (
                  <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:C.muted, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(branches||[]).map(bObj => { const b = bObj.name||bObj;
                const s = statsForDate.find(x => x.branch === b);
                const ac = s ? (s.alter_call || s.alterCall || {}) : {};
                return (
                  <tr key={b} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"9px 12px", fontWeight:700 }}>{b}</td>
                    {s ? <>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.adults}</td>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.vip}</td>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.children}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:C.blue }}>{totalAttendance(s)}</td>
                      <td style={{ padding:"9px 12px" }}>{ac.salvations||0}</td>
                      <td style={{ padding:"9px 12px" }}>{ac.rededications||0}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:C.blue }}>{fmt$(totalOfferings(s))}</td>
                    </> : <td colSpan={7} style={{ padding:"9px 12px", color:C.muted, fontStyle:"italic" }}>No data submitted</td>}
                  </tr>
                );
              })}
              <tr style={{ background:C.bluePale, fontWeight:800 }}>
                <td style={{ padding:"9px 12px" }}>TOTAL</td>
                <td style={{ padding:"9px 12px" }}>{totals.adults}</td>
                <td style={{ padding:"9px 12px" }}>{totals.vip}</td>
                <td style={{ padding:"9px 12px" }}>{totals.children}</td>
                <td style={{ padding:"9px 12px", color:C.blue }}>{totalAtt}</td>
                <td style={{ padding:"9px 12px" }}>{totals.salvations}</td>
                <td style={{ padding:"9px 12px" }}>{totals.rededications}</td>
                <td style={{ padding:"9px 12px", color:C.blue }}>{fmt$(totals.offerings)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── CONSOLIDATED ──────────────────────────────────────────────────────────────
function ConsolidatedPage({ user, stats, branches, cells, districts }) {
  const [filterDate, setFilterDate] = useState("");
  const dates    = [...new Set(stats.map(s => s.date))].sort().reverse();
  const selDate  = filterDate || dates[0];
  const filtered = stats.filter(s => s.date === selDate);

  const totals = filtered.reduce((acc, s) => {
    const ac = s.alter_call || s.alterCall || {};
    return { adults: acc.adults + s.attendance.adults, children: acc.children + s.attendance.children, vip: acc.vip + s.attendance.vip, salvations: acc.salvations + (ac.salvations || 0), rededications: acc.rededications + (ac.rededications || 0), offerings: acc.offerings + totalOfferings(s) };
  }, { adults: 0, children: 0, vip: 0, salvations: 0, rededications: 0, offerings: 0 });

  const barData = (branches||[]).map(bObj => { const b = bObj.name||bObj;
    const s = filtered.find(x => x.branch === b);
    return { branch: b.split(" ")[0], attendance: s ? totalAttendance(s) : 0, offerings: s ? totalOfferings(s) : 0 };
  });

  const [selDistrict, setSelDistrict] = useState("");
  const districtBranches = selDistrict ? branches.filter(b => b.district === selDistrict) : branches;
  const districtFiltered = selDistrict ? filtered.filter(s => s.district === selDistrict) : filtered;
  const distTotals = districtFiltered.reduce((acc, s) => {
    const ac = s.alter_call || s.alterCall || {};
    return { adults: acc.adults + (s.attendance.adults||0), vip: acc.vip + (s.attendance.vip||0), children: acc.children + (s.attendance.children||0), salvations: acc.salvations + (ac.salvations||0), rededications: acc.rededications + (ac.rededications||0), offerings: acc.offerings + totalOfferings(s) };
  }, { adults:0, vip:0, children:0, salvations:0, rededications:0, offerings:0 });

  if (!dates.length) return <Card><p style={{ color: C.muted }}>No stats recorded yet.</p></Card>;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap:"wrap", gap:12 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 900 }}>Consolidated Dashboard</h2><p style={{ color: C.muted, fontSize: 13 }}>All branches · {selDate}</p></div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {(districts||[]).length > 0 && (
            <select value={selDistrict} onChange={e => setSelDistrict(e.target.value)}
              style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
              <option value="">All Districts</option>
              {(districts||[]).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          )}
          <Select value={selDate} onChange={setFilterDate} options={dates.map(d => ({ value: d, label: d }))} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <StatBox label="Total Attendance"  value={totals.adults + totals.children + totals.vip} accent />
        <StatBox label="Adults"            value={totals.adults} />
        <StatBox label="Children"          value={totals.children} />
        <StatBox label="Salvations"        value={totals.salvations} />
        <StatBox label="Re-dedications"    value={totals.rededications} />
        <StatBox label="Total Offerings"   value={totals.offerings} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Attendance by Branch</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="branch" tick={{ fontSize: 11, fill: C.muted }} /><YAxis tick={{ fontSize: 11, fill: C.muted }} /><Tooltip /><Bar dataKey="attendance" fill={C.blue} radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Offerings by Branch</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="branch" tick={{ fontSize: 11, fill: C.muted }} /><YAxis tick={{ fontSize: 11, fill: C.muted }} /><Tooltip formatter={v => fmt$(v)} /><Bar dataKey="offerings" fill={C.accent} radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <SectionTitle>Branch Summary — {selDate}</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: C.bluePale }}>{["Branch", "Adults", "VIP", "Children", "Total Att.", "Salvations", "Re-ded.", "Offerings"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {districtBranches.map(bObj => { const b = bObj.name||bObj;
              const s = districtFiltered.find(x => x.branch === b);
              const ac = s ? (s.alter_call || s.alterCall || {}) : {};
              return (
                <tr key={b} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "9px 12px", fontWeight: 700 }}>{b}</td>
                  {s ? <>
                    <td style={{ padding: "9px 12px" }}>{s.attendance.adults}</td>
                    <td style={{ padding: "9px 12px" }}>{s.attendance.vip}</td>
                    <td style={{ padding: "9px 12px" }}>{s.attendance.children}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: C.blue }}>{totalAttendance(s)}</td>
                    <td style={{ padding: "9px 12px" }}>{ac.salvations || 0}</td>
                    <td style={{ padding: "9px 12px" }}>{ac.rededications || 0}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: C.blue }}>{fmt$(totalOfferings(s))}</td>
                  </> : <td colSpan={7} style={{ padding: "9px 12px", color: C.muted, fontStyle: "italic" }}>No data submitted</td>}
                </tr>
              );
            })}
            <tr style={{ background: C.blueDark }}>
              {["TOTAL","",distTotals.adults,distTotals.vip,distTotals.children,distTotals.adults+distTotals.vip+distTotals.children,distTotals.salvations,distTotals.rededications,fmt$(distTotals.offerings)].map((v,i)=>(
                <td key={i} style={{ padding:"10px 12px",fontWeight:900,color:"#fff",fontSize:13 }}>{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── ADMIN PORTAL ──────────────────────────────────────────────────────────────
function AdminPage({ branches, setBranches, districts, setDistricts, cells, setCells, stats, setStats, refreshAll }) {
  const [tab, setTab]           = useState("users");
  const [users, setUsers]       = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [emailStatus, setEmailStatus]  = useState(null);
  const [saveMsg, setSaveMsg]   = useState({ text: "", type: "success" });
  const [uForm, setUForm] = useState({ name: "", email: "", role: "capturer", branch: "", cell: "", district: "", assignType: "branch", view_branches: [], view_cells: [], password: "" });
  const [newDistrict,   setNewDistrict]   = useState("");
  const [newBranch,     setNewBranch]     = useState("");
  const [newBranchDist, setNewBranchDist] = useState("");
  const [newCell,       setNewCell]       = useState("");
  const [newCellDist,   setNewCellDist]   = useState("");
  const [editUId,       setEditUId]       = useState(null);
  const upd = (k, v) => setUForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    db.get("cc_users", "order=id.asc").then(data => { setUsers(data); setLoadingUsers(false); }).catch(() => setLoadingUsers(false));
  }, []);

  const showMsg = (text, type = "success") => { setSaveMsg({ text, type }); setTimeout(() => setSaveMsg({ text: "", type: "success" }), 10000); };
  const clearForm = () => setUForm({ name: "", email: "", role: "capturer", branch: "", cell: "", district: "", assignType: "branch", view_branches: [], view_cells: [], password: "" });

  const saveUser = async () => {
    if (!uForm.name || !uForm.email || !uForm.password) { showMsg("❌ Name, email and password are required.", "error"); return; }
    console.log("SAVING USER — assignType:", uForm.assignType, "branch:", uForm.branch, "cell:", uForm.cell);
    const cleanUser = {
      name: uForm.name.trim(), email: uForm.email.trim().toLowerCase(),
      password: uForm.password.trim(), role: uForm.role,
      branch: (uForm.role === "capturer" && uForm.assignType === "branch") ? (uForm.branch||"") : null,
      cell:   (uForm.role === "capturer" && uForm.assignType === "cell")   ? (uForm.cell||null) : null,
      district: uForm.district || null,
      view_branches: (uForm.role === "viewer") ? JSON.stringify(uForm.view_branches || []) : null,
      view_cells:    (uForm.role === "viewer") ? JSON.stringify(uForm.view_cells || []) : null,
    };
    try {
      if (editUId) {
        const [updated] = await db.update("cc_users", { id: editUId }, cleanUser);
        setUsers(us => us.map(u => u.id === editUId ? updated : u));
        setEditUId(null);
        showMsg(`✅ "${cleanUser.name}" updated — login: ${cleanUser.email} / ${cleanUser.password}`);
      } else {
        const [created] = await db.insert("cc_users", cleanUser);
        setUsers(us => [...us, created]);
        showMsg(`✅ "${cleanUser.name}" created — login: ${cleanUser.email} / ${cleanUser.password}`);
        setEmailStatus("sending");
        const r = await sendWelcomeEmail({ toName: cleanUser.name, toEmail: cleanUser.email, password: cleanUser.password, role: cleanUser.role, branch: cleanUser.branch, appUrl: window.location.origin });
        setEmailStatus(r.ok ? "sent" : (r.reason === "not configured" ? "unconfigured" : "error"));
        setTimeout(() => setEmailStatus(null), 7000);
      }
      clearForm();
    } catch (e) { showMsg("❌ " + e.message, "error"); }
  };

  const editUser = u => {
    let vb = [], vc = [];
    try { vb = JSON.parse(u.view_branches || "[]"); } catch {}
    try { vc = JSON.parse(u.view_cells || "[]"); } catch {}
    const assignType = u.cell ? "cell" : "branch";
    setUForm({ name: u.name, email: u.email, role: u.role, branch: u.branch||"", cell: u.cell||"", district: u.district||"", assignType, view_branches: vb, view_cells: vc, password: u.password });
    setEditUId(u.id);
  };
  const resetUserPwd = async u => {
    const newPwd = window.prompt(`Set new password for ${u.name}:`);
    if (!newPwd || newPwd.length < 4) return;
    try {
      await db.update("cc_users", { id: u.id }, { password: newPwd });
      setUsers(us => us.map(x => x.id === u.id ? { ...x, password: newPwd } : x));
      showMsg(`✅ Password reset for ${u.name}.`);
    } catch(e) { showMsg("❌ " + e.message, "error"); }
  };
  const deleteUser = async id => {
    if (!window.confirm("Delete this user?")) return;
    await db.delete("cc_users", { id });
    setUsers(us => us.filter(u => u.id !== id));
  };

  const addBranch = async () => {
    const b = newBranch.trim();
    if (!b || branches.find(x=>(x.name||x)===b)) return;
    if (!newBranchDist) { showMsg("⚠️ Please select a district for this branch.", "warn"); return; }
    const [rec] = await db.insert("cc_branches", { name: b, district: newBranchDist });
    setBranches(bs => [...bs, rec]); setNewBranch(""); setNewBranchDist("");
    showMsg(`✅ Branch "${b}" added under ${newBranchDist}.`);
  };

  const removeBranch = async b => {
    if (!window.confirm(`Remove branch "${b}"? Stats for this branch will remain.`)) return;
    await db.delete("cc_branches", { name: b });
    setBranches(bs => bs.filter(x => (x.name||x) !== b));
  };

  const addDistrict = async () => {
    const d = newDistrict.trim();
    if (!d || districts.find(x=>x.name===d)) return;
    const [rec] = await db.insert("cc_districts", { name: d });
    setDistricts(ds => [...ds, rec]); setNewDistrict("");
  };
  const deleteDistrict = async name => {
    if (!window.confirm(`Delete district "${name}"? This does not delete its branches/cells.`)) return;
    await db.delete("cc_districts", { name });
    setDistricts(ds => ds.filter(x => x.name !== name));
  };
  const addCell = async () => {
    const n = newCell.trim();
    if (!n || cells.find(x=>x.name===n)) return;
    if (!newCellDist) { showMsg("⚠️ Please select a district for this cell.", "warn"); return; }
    const [rec] = await db.insert("cc_cells", { name: n, district: newCellDist });
    setCells(cl => [...cl, rec]); setNewCell(""); setNewCellDist("");
    showMsg(`✅ Cell "${n}" added under ${newCellDist}.`);
  };
  const deleteCell = async name => {
    if (!window.confirm(`Delete cell "${name}"?`)) return;
    await db.delete("cc_cells", { name });
    setCells(cl => cl.filter(x => x.name !== name));
  };
  const deleteStat = async id => {
    if (!window.confirm("Delete this stat record?")) return;
    await db.delete("cc_stats", { id });
    setStats(ss => ss.filter(s => s.id !== id));
  };

  const tabs = [{ id: "users", label: "👥 Users" }, { id: "districts", label: "🗺️ Districts" }, { id: "branches", label: "🏛️ Branches" }, { id: "cells", label: "🔵 Cells" }, { id: "stats", label: "📋 Stats Log" }];

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Admin Portal</h2>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Manage users, branches and data — all changes sync instantly across devices.</p>

      {saveMsg.text && <Alert msg={saveMsg.text} type={saveMsg.type} />}
      {emailStatus === "sending"      && <Alert msg="📧 Sending welcome email…" type="info" />}
      {emailStatus === "sent"         && <Alert msg="✅ Welcome email sent!" type="success" />}
      {emailStatus === "error"        && <Alert msg="❌ Email failed — share the login details from the green banner above manually." type="error" />}
      {emailStatus === "unconfigured" && <Alert msg="⚠️ User created. Configure EmailJS to auto-send emails." type="warn" />}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `2px solid ${C.border}` }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ border: "none", background: "transparent", padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Lato,sans-serif", color: tab === t.id ? C.blue : C.muted, borderBottom: tab === t.id ? `2px solid ${C.blue}` : "2px solid transparent", marginBottom: -2 }}>{t.label}</button>)}
      </div>

      {tab === "users" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <SectionTitle>{editUId ? "Edit User" : "Add New User"}</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Input label="Full Name" value={uForm.name}     onChange={v => upd("name", v)} />
                <Input label="Email"     value={uForm.email}    onChange={v => upd("email", v)}    type="email" />
                <Input label="Password"  value={uForm.password} onChange={v => upd("password", v)} />
                <Select label="Role" value={uForm.role} onChange={v => upd("role", v)} options={[{ value: "capturer", label: "Data Capturer" }, { value: "viewer", label: "Viewer (Read Only)" }, { value: "admin", label: "Administrator" }]} />
                {uForm.role === "capturer" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>Assign To (pick ONE)</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {["branch","cell"].map(t=>(
                        <button key={t} type="button" onClick={()=>{ upd("assignType",t); upd("branch",""); upd("cell",""); }}
                          style={{ flex:1, padding:"8px", borderRadius:8, border:`2px solid ${uForm.assignType===t?C.blue:C.border}`, background:uForm.assignType===t?C.bluePale:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Lato,sans-serif", color:uForm.assignType===t?C.blue:C.muted, textTransform:"capitalize" }}>
                          {t==="branch"?"🏛️ Branch":"🔵 Cell"}
                        </button>
                      ))}
                    </div>
                    {uForm.assignType === "branch" ? (
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <label style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Branch</label>
                        <select value={uForm.branch||""} onChange={e=>{upd("branch",e.target.value);upd("cell","");}}
                          style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",fontSize:14,fontFamily:"Lato,sans-serif",background:"#fff"}}>
                          <option value="">— Select Branch —</option>
                          {[...new Set((branches||[]).map(b=>b.district||"Other"))].map(dist=>(
                            <optgroup key={dist} label={`🗺️ ${dist}`}>
                              {(branches||[]).filter(b=>(b.district||"Other")===dist).map(b=>(
                                <option key={b.name} value={b.name}>{b.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <label style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Cell</label>
                        <select value={uForm.cell||""} onChange={e=>{upd("cell",e.target.value);upd("branch","");}}
                          style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px",fontSize:14,fontFamily:"Lato,sans-serif",background:"#fff"}}>
                          <option value="">— Select Cell —</option>
                          {[...new Set((cells||[]).map(cl=>cl.district||"Other"))].map(dist=>(
                            <optgroup key={dist} label={`🗺️ ${dist}`}>
                              {(cells||[]).filter(cl=>(cl.district||"Other")===dist).map(cl=>(
                                <option key={cl.name} value={cl.name}>{cl.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
                {uForm.role === "viewer" && <>
                  <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:4}}>ASSIGN BRANCHES TO VIEW</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {(branches||[]).map(b=>{ const bn=b.name||b; return (
                      <label key={bn} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer",padding:"4px 10px",borderRadius:20,border:`1px solid ${(uForm.view_branches||[]).includes(bn)?C.blue:C.border}`,background:(uForm.view_branches||[]).includes(bn)?C.bluePale:"#fff"}}>
                        <input type="checkbox" checked={(uForm.view_branches||[]).includes(bn)} onChange={e=>{const arr=uForm.view_branches||[];upd("view_branches",e.target.checked?[...arr,bn]:arr.filter(x=>x!==bn));}} style={{accentColor:C.blue}} />{bn}
                      </label>
                    );})}
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:4}}>ASSIGN CELLS TO VIEW</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(cells||[]).map(cl=>(
                      <label key={cl.name} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer",padding:"4px 10px",borderRadius:20,border:`1px solid ${(uForm.view_cells||[]).includes(cl.name)?C.blue:C.border}`,background:(uForm.view_cells||[]).includes(cl.name)?C.bluePale:"#fff"}}>
                        <input type="checkbox" checked={(uForm.view_cells||[]).includes(cl.name)} onChange={e=>{const arr=uForm.view_cells||[];upd("view_cells",e.target.checked?[...arr,cl.name]:arr.filter(x=>x!==cl.name));}} style={{accentColor:C.blue}} />{cl.name}
                      </label>
                    ))}
                  </div>
                </>}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Btn onClick={saveUser}>{editUId ? "Update User" : "Add User"}</Btn>
                  {editUId && <Btn variant="secondary" onClick={() => { setEditUId(null); clearForm(); }}>Cancel</Btn>}
                </div>
              </div>
            </Card>
            <Card>
              <SectionTitle>All Users ({users.length})</SectionTitle>
              {loadingUsers ? <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: C.bluePale }}>{["Name","Email","Role","Assigned To","Actions"].map(h => <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "8px 10px", color: C.muted, fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <Badge color={u.role==="admin"?C.accent:u.role==="viewer"?"#7c3aed":C.blue}>
                            {u.role==="admin"?"Admin":u.role==="viewer"?"Viewer":"Capturer"}
                          </Badge>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 12, color: C.muted }}>
                          {u.role==="viewer" ? (()=>{try{const vb=JSON.parse(u.view_branches||"[]");return vb.length?vb.join(", "):"All Branches";}catch{return "All Branches";}})()
                           : u.role==="capturer" ? `${u.branch||"—"}${u.cell?" / "+u.cell:""}` : "All"}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn variant="secondary" onClick={() => editUser(u)} style={{ padding: "4px 10px", fontSize: 11 }}>Edit</Btn>
                            <Btn variant="secondary" onClick={() => resetUserPwd(u)} style={{ padding: "4px 10px", fontSize: 11, color: C.blue }}>🔑 Pwd</Btn>
                            <Btn variant="danger" onClick={() => deleteUser(u.id)} style={{ padding: "4px 10px", fontSize: 11 }}>Del</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === "districts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <SectionTitle>Add District</SectionTitle>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Create districts first — branches and cells will be assigned to a district.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="District Name" value={newDistrict} onChange={setNewDistrict} />
              <Btn onClick={addDistrict} disabled={!newDistrict.trim()}>+ Add District</Btn>
            </div>
          </Card>
          <Card>
            <SectionTitle>Districts ({districts.length})</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {(districts||[]).map(d => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.bluePale, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>🗺️ {d.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {(branches||[]).filter(b => b.district === d.name).length} branch{branches.filter(b=>b.district===d.name).length!==1?"es":""} · {(cells||[]).filter(cl => cl.district === d.name).length} cell{cells.filter(cl=>cl.district===d.name).length!==1?"s":""}
                    </div>
                  </div>
                  <Btn variant="danger" onClick={() => deleteDistrict(d.name)} style={{ padding: "4px 10px", fontSize: 11 }}>✕ Remove</Btn>
                </div>
              ))}
              {!districts.length && (
                <div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
                  <div style={{ fontSize: 13 }}>No districts yet. Add your first district above.</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "branches" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <SectionTitle>Add Branch</SectionTitle>
            {!districts.length && (
              <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 12, fontWeight: 600 }}>
                ⚠️ Create at least one District first before adding branches.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="Branch Name" value={newBranch} onChange={setNewBranch} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>District *</label>
                <select value={newBranchDist} onChange={e => setNewBranchDist(e.target.value)}
                  style={{ border: `1px solid ${!newBranchDist && newBranch ? "#ef4444" : C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "Lato,sans-serif", background: "#fff", cursor: "pointer" }}>
                  <option value="">— Select District —</option>
                  {(districts||[]).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                {!newBranchDist && newBranch && <span style={{ fontSize: 11, color: "#ef4444" }}>District is required</span>}
              </div>
              <Btn onClick={addBranch} disabled={!newBranch.trim() || !newBranchDist}>+ Add Branch</Btn>
            </div>
          </Card>
          <Card>
            <SectionTitle>Branches ({branches.length})</SectionTitle>
            {(districts||[]).map(d => {
              const dBranches = (branches||[]).filter(b => b.district === d.name);
              if (!dBranches.length) return null;
              return (
                <div key={d.name} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    🗺️ {d.name} <span style={{ background: C.bluePale, borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>{dBranches.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dBranches.map(b => (
                      <div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: C.bluePale, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>🏛️ {b.name}</div>
                        <Btn variant="danger" onClick={() => removeBranch(b.name)} style={{ padding: "3px 8px", fontSize: 10 }}>✕</Btn>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(branches||[]).filter(b => !b.district).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>⚠️ Unassigned</div>
                {(branches||[]).filter(b => !b.district).map(b => (
                  <div key={b.name||b} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#fff7ed", borderRadius: 8, border: `1px solid #fed7aa`, marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>🏛️ {b.name||b}</div>
                    <Btn variant="danger" onClick={() => removeBranch(b.name||b)} style={{ padding: "3px 8px", fontSize: 10 }}>✕</Btn>
                  </div>
                ))}
              </div>
            )}
            {!branches.length && (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
                <div style={{ fontSize: 13 }}>No branches yet.</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "cells" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <SectionTitle>Add Cell</SectionTitle>
            {!districts.length && (
              <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 12, fontWeight: 600 }}>
                ⚠️ Create at least one District first before adding cells.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="Cell Name" value={newCell} onChange={setNewCell} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>District *</label>
                <select value={newCellDist} onChange={e => setNewCellDist(e.target.value)}
                  style={{ border: `1px solid ${!newCellDist && newCell ? "#ef4444" : C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 14, fontFamily: "Lato,sans-serif", background: "#fff", cursor: "pointer" }}>
                  <option value="">— Select District —</option>
                  {(districts||[]).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                {!newCellDist && newCell && <span style={{ fontSize: 11, color: "#ef4444" }}>District is required</span>}
              </div>
              <Btn onClick={addCell} disabled={!newCell.trim() || !newCellDist}>+ Add Cell</Btn>
            </div>
          </Card>
          <Card>
            <SectionTitle>Cells ({cells.length})</SectionTitle>
            {(districts||[]).map(d => {
              const dCells = cells.filter(cl => cl.district === d.name);
              if (!dCells.length) return null;
              return (
                <div key={d.name} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    🗺️ {d.name} <span style={{ background: C.bluePale, borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>{dCells.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dCells.map(cl => (
                      <div key={cl.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: C.bluePale, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>🔵 {cl.name}</div>
                        <Btn variant="danger" onClick={() => deleteCell(cl.name)} style={{ padding: "3px 8px", fontSize: 10 }}>✕</Btn>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {(cells||[]).filter(cl => !cl.district).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>⚠️ Unassigned</div>
                {(cells||[]).filter(cl => !cl.district).map(cl => (
                  <div key={cl.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>🔵 {cl.name}</div>
                    <Btn variant="danger" onClick={() => deleteCell(cl.name)} style={{ padding: "3px 8px", fontSize: 10 }}>✕</Btn>
                  </div>
                ))}
              </div>
            )}
            {!cells.length && (
              <div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔵</div>
                <div style={{ fontSize: 13 }}>No cells yet.</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "stats" && (
        <Card>
          <SectionTitle>Statistics Log ({stats.length} records)</SectionTitle>
          {!stats.length && <p style={{ color: C.muted, fontSize: 13 }}>No stats recorded yet.</p>}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
              <thead><tr style={{ background: C.bluePale }}>{["Date", "Branch", "Adults", "VIP", "Children", "Total Att.", "Salvations", "Offerings", ""].map(h => <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {[...stats].sort((a, b) => b.date.localeCompare(a.date)).map(s => {
                  const ac = s.alter_call || s.alterCall || {};
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 10px" }}>{s.date}</td>
                      <td style={{ padding: "7px 10px", fontWeight: 600 }}>{s.branch}</td>
                      <td style={{ padding: "7px 10px" }}>{s.attendance.adults}</td>
                      <td style={{ padding: "7px 10px" }}>{s.attendance.vip}</td>
                      <td style={{ padding: "7px 10px" }}>{s.attendance.children}</td>
                      <td style={{ padding: "7px 10px", fontWeight: 700, color: C.blue }}>{totalAttendance(s)}</td>
                      <td style={{ padding: "7px 10px" }}>{ac.salvations || 0}</td>
                      <td style={{ padding: "7px 10px", fontWeight: 700, color: C.blue }}>{fmt$(totalOfferings(s))}</td>
                      <td style={{ padding: "7px 10px" }}><Btn variant="danger" onClick={() => deleteStat(s.id)} style={{ padding: "3px 8px", fontSize: 10 }}>Delete</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── PROFILE / PASSWORD RESET ─────────────────────────────────────────────────
function ProfilePage({ user, setUser }) {
  const [oldPwd,  setOldPwd]  = useState("");
  const [newPwd,  setNewPwd]  = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "success" });
  const [saving, setSaving] = useState(false);

  const showMsg = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "success" }), 7000); };

  const changePassword = async () => {
    if (!oldPwd || !newPwd || !newPwd2) { showMsg("All fields are required.", "error"); return; }
    if (oldPwd !== user.password) { showMsg("Current password is incorrect.", "error"); return; }
    if (newPwd !== newPwd2) { showMsg("New passwords do not match.", "error"); return; }
    if (newPwd.length < 6) { showMsg("New password must be at least 6 characters.", "error"); return; }
    setSaving(true);
    try {
      const [updated] = await db.update("cc_users", { id: user.id }, { password: newPwd });
      setUser({ ...user, password: newPwd });
      setOldPwd(""); setNewPwd(""); setNewPwd2("");
      showMsg("✅ Password changed successfully!");
    } catch(e) { showMsg("❌ " + e.message, "error"); }
    setSaving(false);
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>My Profile</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Manage your account details</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800 }}>
        <Card>
          <SectionTitle>Account Info</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.bluePale, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.blueDark }}>{user.name}</div>
            </div>
            <div style={{ background: C.bluePale, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 15, color: C.blueDark }}>{user.email}</div>
            </div>
            <div style={{ background: C.bluePale, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Role</div>
              <div><Badge color={user.role === "admin" ? C.accent : C.blue}>{user.role === "admin" ? "Administrator" : "Data Capturer"}</Badge></div>
            </div>
            {user.cell && (
              <div style={{ background: C.bluePale, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Cell</div>
                <div style={{ fontSize: 15, color: C.blueDark }}>🔵 {user.cell}</div>
              </div>
            )}
            {!user.cell && user.branch && (
              <div style={{ background: C.bluePale, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Branch</div>
                <div style={{ fontSize: 15, color: C.blueDark }}>🏛️ {user.branch}</div>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <SectionTitle>Change Password</SectionTitle>
          <Alert msg={msg.text} type={msg.type} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Current Password" value={oldPwd} onChange={setOldPwd} type="password" />
            <Input label="New Password" value={newPwd} onChange={setNewPwd} type="password" />
            <Input label="Confirm New Password" value={newPwd2} onChange={setNewPwd2} type="password" />
            <Btn onClick={changePassword} disabled={saving} style={{ marginTop: 4 }}>
              {saving ? "Saving…" : "Update Password"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── CELLS DASHBOARD ──────────────────────────────────────────────────────────
function CellsDashboardPage({ user, stats, cells, districts }) {
  const [selCell,     setSelCell]     = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [selDate,     setSelDate]     = useState("");

  const cellStats = stats.filter(s => s.cell);
  const allDates  = [...new Set(cellStats.map(s => s.date))].sort().reverse();
  const activeDate = selDate || allDates[0] || "";

  const viewCells = user.role === "viewer"
    ? (JSON.parse(user.view_cells || "[]"))
    : cells.map(c => c.name);

  const filtered = cellStats.filter(s => {
    const dateOk     = !activeDate || s.date === activeDate;
    const cellOk     = selCell ? s.cell === selCell : viewCells.includes(s.cell);
    const districtOk = selDistrict ? s.district === selDistrict : true;
    return dateOk && cellOk && districtOk;
  });

  const totals = filtered.reduce((acc, s) => {
    const ac = s.alter_call || s.alterCall || {};
    return {
      adults:     acc.adults     + (s.attendance.adults    || 0),
      vip:        acc.vip        + (s.attendance.vip       || 0),
      children:   acc.children   + (s.attendance.children  || 0),
      salvations: acc.salvations + (ac.salvations           || 0),
      offerings:  acc.offerings  + totalOfferings(s),
    };
  }, { adults: 0, vip: 0, children: 0, salvations: 0, offerings: 0 });

  const visibleCells = selCell ? [selCell]
    : selDistrict ? cells.filter(cl => cl.district === selDistrict).map(cl => cl.name)
    : viewCells;

  const barData = visibleCells.map(cn => {
    const s = filtered.find(x => x.cell === cn);
    return { cell: cn.length > 10 ? cn.slice(0,10)+"…" : cn, attendance: s ? (s.attendance.adults+s.attendance.vip+s.attendance.children) : 0, offerings: s ? totalOfferings(s) : 0 };
  });

  if (!allDates.length) return <Card><p style={{ color: C.muted, padding: "12px 0" }}>No cell stats recorded yet. Assign a cell when capturing stats.</p></Card>;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900 }}>Cells Dashboard</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>{activeDate ? `Date: ${activeDate}` : "All dates"} · {filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {user.role === "admin" && (districts||[]).length > 0 && (
            <Select value={selDistrict} onChange={v => { setSelDistrict(v); setSelCell(""); }}
              options={[{ value: "", label: "All Districts" }, ...(districts||[]).map(d => ({ value: d.name, label: d.name }))]} />
          )}
          {(user.role === "admin" || user.role === "viewer") && (
            <Select value={selCell} onChange={setSelCell}
              options={[{ value: "", label: "All Cells" }, ...(cells||[]).filter(cl => !selDistrict || cl.district === selDistrict).map(cl => ({ value: cl.name, label: cl.name }))]} />
          )}
          <Select value={selDate} onChange={setSelDate}
            options={[{ value: "", label: allDates[0] ? `Latest (${allDates[0]})` : "No data" }, ...allDates.map(d => ({ value: d, label: d }))]} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { label: "Total Attendance", value: totals.adults + totals.vip + totals.children, accent: true },
          { label: "Adults",           value: totals.adults },
          { label: "Children",         value: totals.children },
          { label: "Salvations",       value: totals.salvations },
          { label: "Total Offerings",  value: fmt$(totals.offerings) },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: accent ? C.blueDark : "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", flex: "1 1 130px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: accent ? "rgba(255,255,255,0.7)" : C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: accent ? "#fff" : C.blueDark }}>{value}</div>
          </div>
        ))}
      </div>

      {barData.some(d => d.attendance > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card>
            <SectionTitle>Attendance by Cell</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="cell" tick={{ fontSize: 11, fill: C.muted }} /><YAxis tick={{ fontSize: 11, fill: C.muted }} /><Tooltip /><Bar dataKey="attendance" fill={C.blue} radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle>Offerings by Cell</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="cell" tick={{ fontSize: 11, fill: C.muted }} /><YAxis tick={{ fontSize: 11, fill: C.muted }} /><Tooltip formatter={v=>fmt$(v)} /><Bar dataKey="offerings" fill={C.accent} radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card>
        <SectionTitle>Cell Summary — {activeDate || "All Dates"}</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: C.bluePale }}>{["Cell","District","Adults","VIP","Children","Total Att.","Salvations","Offerings"].map(h=><th key={h} style={{ padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:800,color:C.muted,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>
              {visibleCells.map(cn => {
                const s = filtered.find(x => x.cell === cn);
                const cellObj = cells.find(cl => cl.name === cn) || {};
                const ac = s ? (s.alter_call || s.alterCall || {}) : {};
                return (
                  <tr key={cn} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding:"9px 12px",fontWeight:700 }}>🔵 {cn}</td>
                    <td style={{ padding:"9px 12px",color:C.muted,fontSize:12 }}>{cellObj.district||s?.district||"—"}</td>
                    {s ? <>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.adults}</td>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.vip}</td>
                      <td style={{ padding:"9px 12px" }}>{s.attendance.children}</td>
                      <td style={{ padding:"9px 12px",fontWeight:700,color:C.blue }}>{s.attendance.adults+s.attendance.vip+s.attendance.children}</td>
                      <td style={{ padding:"9px 12px" }}>{ac.salvations||0}</td>
                      <td style={{ padding:"9px 12px",fontWeight:700,color:C.blue }}>{fmt$(totalOfferings(s))}</td>
                    </> : <td colSpan={6} style={{ padding:"9px 12px",color:C.muted,fontStyle:"italic" }}>No data submitted</td>}
                  </tr>
                );
              })}
              <tr style={{ background:C.blueDark }}>
                {["TOTAL","",totals.adults,totals.vip,totals.children,totals.adults+totals.vip+totals.children,totals.salvations,fmt$(totals.offerings)].map((v,i)=>(
                  <td key={i} style={{ padding:"10px 12px",fontWeight:900,color:"#fff",fontSize:13 }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── REPORTS PAGE ──────────────────────────────────────────────────────────────
function ReportsPage({ user, stats, branches, cells, districts }) {
  const [repType,     setRepType]     = useState("monthly");
  const [repView,     setRepView]     = useState("branches"); // branches | cells
  const [repYear,     setRepYear]     = useState(new Date().getFullYear().toString());
  const [repBranch,   setRepBranch]   = useState("");
  const [repDistrict, setRepDistrict] = useState("");
  const [exporting,   setExporting]   = useState("");

  const years = [...new Set(stats.map(s => s.date.slice(0,4)))].sort().reverse();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // ── Build monthly summary rows ────────────────────────────────────────────
  // Scope stats for capturer — only their branch or cell
  const isCapturer  = user.role === "capturer";
  const capturerStats = isCapturer
    ? (user.cell ? stats.filter(s => s.cell === user.cell) : stats.filter(s => s.branch === (user.branch||"")))
    : stats;

  const buildRows = () => {
    const filtered = capturerStats.filter(s => {
      const yearMatch    = repType === "yearly" || s.date.startsWith(repYear);
      const branchMatch  = repView === "cells"
        ? (repBranch ? s.cell === repBranch : !!s.cell)
        : (repBranch ? s.branch === repBranch : true);
      const districtMatch = repDistrict ? s.district === repDistrict : true;
      return yearMatch && branchMatch && districtMatch;
    });

    if (repType === "monthly") {
      return Array.from({ length: 12 }, (_, i) => {
        const mo = String(i + 1).padStart(2, "0");
        const rows = filtered.filter(s => s.date.slice(5, 7) === mo);
        const ac = rows.reduce((a, s) => {
          const alt = s.alter_call || s.alterCall || {};
          return {
            adults:        a.adults        + (s.attendance.adults   || 0),
            vip:           a.vip           + (s.attendance.vip      || 0),
            children:      a.children      + (s.attendance.children || 0),
            salvations:    a.salvations    + (alt.salvations         || 0),
            rededications: a.rededications + (alt.rededications      || 0),
            offerings:     a.offerings     + totalOfferings(s),
            services:      a.services      + 1,
          };
        }, { adults:0, vip:0, children:0, salvations:0, rededications:0, offerings:0, services:0 });
        return { label: months[i] + " " + repYear, ...ac, total: ac.adults + ac.vip + ac.children };
      });
    } else {
      // yearly — one row per year
      const allYears = [...new Set(stats.map(s => s.date.slice(0,4)))].sort();
      return allYears.map(yr => {
        const rows = stats.filter(s => s.date.startsWith(yr) && (repBranch ? s.branch === repBranch : true));
        const ac = rows.reduce((a, s) => {
          const alt = s.alter_call || s.alterCall || {};
          return {
            adults:        a.adults        + (s.attendance.adults   || 0),
            vip:           a.vip           + (s.attendance.vip      || 0),
            children:      a.children      + (s.attendance.children || 0),
            salvations:    a.salvations    + (alt.salvations         || 0),
            rededications: a.rededications + (alt.rededications      || 0),
            offerings:     a.offerings     + totalOfferings(s),
            services:      a.services      + 1,
          };
        }, { adults:0, vip:0, children:0, salvations:0, rededications:0, offerings:0, services:0 });
        return { label: yr, ...ac, total: ac.adults + ac.vip + ac.children };
      });
    }
  };

  const rows = buildRows();
  const totalsRow = rows.reduce((a, r) => ({
    adults: a.adults + r.adults, vip: a.vip + r.vip, children: a.children + r.children,
    salvations: a.salvations + r.salvations, rededications: a.rededications + r.rededications,
    offerings: a.offerings + r.offerings, services: a.services + r.services, total: a.total + r.total,
  }), { adults:0, vip:0, children:0, salvations:0, rededications:0, offerings:0, services:0, total:0 });

  const chartData = rows.filter(r => r.total > 0 || r.services > 0);

  // ── Export to CSV/Excel ──────────────────────────────────────────────────
  const exportCSV = () => {
    setExporting("csv");
    const header = ["Period","Services","Adults","VIP","Children","Total Attendance","Salvations","Re-dedications","Total Offerings"];
    const dateStr = new Date().toLocaleDateString("en-GB");
    const csvRows = [
      `"Celebration Churches International — ${repType === "monthly" ? "Monthly" : "Yearly"} Report"`,
      `"${repBranch || "All Branches"} · ${repType === "yearly" ? "All Years" : repYear} · Generated: ${dateStr}"`,
      "",
      header.join(","),
      ...rows.map(r => [r.label, r.services, r.adults, r.vip, r.children, r.total, r.salvations, r.rededications, r.offerings.toFixed(2)].join(",")),
      ["TOTAL", totalsRow.services, totalsRow.adults, totalsRow.vip, totalsRow.children, totalsRow.total, totalsRow.salvations, totalsRow.rededications, totalsRow.offerings.toFixed(2)].join(","),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `CCI_${repType}_${repBranch || "AllBranches"}_${repYear || "AllYears"}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setTimeout(() => setExporting(""), 2000);
  };

  // ── Export to PDF ────────────────────────────────────────────────────────
  const exportPDF = () => {
    setExporting("pdf");
    const branchLabel = repBranch || "All Branches";
    const title = `Celebration Church — ${repType === "monthly" ? "Monthly" : "Yearly"} Report`;
    const subtitle = `${branchLabel} · ${repType === "yearly" ? "All Years" : repYear}`;

    const tableRows = rows.map(r => `
      <tr>
        <td>${r.label}</td><td>${r.services}</td><td>${r.adults}</td><td>${r.vip}</td>
        <td>${r.children}</td><td><strong>${r.total}</strong></td>
        <td>${r.salvations}</td><td>${r.rededications}</td>
        <td><strong>$${r.offerings.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:40px;color:#1a1a2e;font-size:12px}
      .header{text-align:center;margin-bottom:30px;border-bottom:3px solid #4A6FA5;padding-bottom:20px;display:flex;align-items:center;justify-content:center;gap:24px}
      .header-text{text-align:left}
      h1{color:#2d4a73;font-size:20px;margin:0 0 4px}
      .sub{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#4A6FA5;color:#fff;padding:8px 10px;text-align:left;font-size:11px}
      td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:11px}
      tr:nth-child(even) td{background:#f8faff}
      .totals td{background:#2d4a73;color:#fff;font-weight:bold;padding:9px 10px}
      .kpi{display:flex;gap:16px;margin:20px 0;flex-wrap:wrap}
      .kpi-box{background:#f0f4ff;border-radius:8px;padding:14px 20px;flex:1;min-width:120px;border-left:4px solid #4A6FA5}
      .kpi-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
      .kpi-val{font-size:20px;font-weight:bold;color:#2d4a73}
      .no-print{display:block;text-align:center;margin:20px 0;display:flex;gap:12px;justify-content:center}
      .btn{padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700}
      .btn-print{background:#4A6FA5;color:#fff}
      .btn-dl{background:#F0B429;color:#1a1a2e}
      @media print{.no-print{display:none!important}body{margin:20px}}
    </style></head><body>
    <div class="no-print">
      <button class="btn btn-print" onclick="window.print()">🖨 Print Report</button>
      <button class="btn btn-dl" onclick="downloadCSV()">⬇ Download CSV</button>
    </div>
    <div class="header">
      <img src="${LOGO}" style="height:70px;border-radius:8px;padding:4px" alt="CCI Logo" />
      <div class="header-text">
        <h1>${title}</h1>
        <div class="sub">${subtitle}</div>
        <div class="sub">Generated: ${new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        <div class="sub" style="color:#4A6FA5;font-weight:bold">Celebration Churches International</div>
      </div>
    </div>
    <div class="kpi">
      <div class="kpi-box"><div class="kpi-label">Total Services</div><div class="kpi-val">${totalsRow.services}</div></div>
      <div class="kpi-box"><div class="kpi-label">Total Attendance</div><div class="kpi-val">${totalsRow.total.toLocaleString()}</div></div>
      <div class="kpi-box"><div class="kpi-label">Salvations</div><div class="kpi-val">${totalsRow.salvations}</div></div>
      <div class="kpi-box"><div class="kpi-label">Total Offerings</div><div class="kpi-val">$${totalsRow.offerings.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
    </div>
    <table>
      <thead><tr><th>Period</th><th>Services</th><th>Adults</th><th>VIP</th><th>Children</th><th>Total Att.</th><th>Salvations</th><th>Re-ded.</th><th>Offerings</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr class="totals"><td>TOTAL</td><td>${totalsRow.services}</td><td>${totalsRow.adults}</td><td>${totalsRow.vip}</td><td>${totalsRow.children}</td><td>${totalsRow.total}</td><td>${totalsRow.salvations}</td><td>${totalsRow.rededications}</td><td>$${totalsRow.offerings.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr></tfoot>
    </table>
    <scr"+"ipt>window.onload=()=>{window.print();}</scr"+"ipt>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    setTimeout(() => { URL.revokeObjectURL(url); setExporting(""); }, 3000);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Reports</h2>
          <p style={{ color: C.muted, fontSize: 13 }}>Monthly & yearly summaries with export</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn onClick={exportCSV} disabled={!!exporting} variant="secondary" style={{ fontSize: 13 }}>
            {exporting === "csv" ? "Exporting…" : "⬇ Export Excel/CSV"}
          </Btn>
          <Btn onClick={exportPDF} disabled={!!exporting} style={{ fontSize: 13 }}>
            {exporting === "pdf" ? "Opening…" : "🖨 Export PDF"}
          </Btn>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Report type: monthly / yearly */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Report Type</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["monthly","yearly"].map(t => (
                <button key={t} onClick={() => setRepType(t)} style={{ padding: "8px 18px", borderRadius: 8, border: `2px solid ${repType===t?C.blue:C.border}`, background: repType===t?C.blue:"#fff", color: repType===t?"#fff":C.muted, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Lato,sans-serif", textTransform:"capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {/* Year — only for monthly */}
          {repType === "monthly" && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Year</div>
              <Select value={repYear} onChange={setRepYear} options={years.length ? years.map(y=>({value:y,label:y})) : [{value:new Date().getFullYear().toString(),label:new Date().getFullYear().toString()}]} />
            </div>
          )}
          {/* View toggle: Branches vs Cells — hide for capturer */}
          {!isCapturer && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>View</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{id:"branches",label:"🏛️ Branches"},{id:"cells",label:"🔵 Cells"}].map(t => (
                  <button key={t.id} onClick={() => { setRepView(t.id); setRepBranch(""); setRepDistrict(""); }}
                    style={{ padding:"8px 16px", borderRadius:8, border:`2px solid ${repView===t.id?C.blue:C.border}`, background:repView===t.id?C.blue:"#fff", color:repView===t.id?"#fff":C.muted, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Lato,sans-serif" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* District filter — only for admin/viewer */}
          {!isCapturer && (districts||[]).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>District</div>
              <select value={repDistrict} onChange={e => { setRepDistrict(e.target.value); setRepBranch(""); }}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
                <option value="">All Districts</option>
                {(districts||[]).map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          )}
          {/* Branch or Cell filter */}
          {!isCapturer && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                {repView === "cells" ? "Cell" : "Branch"}
              </div>
              <select value={repBranch} onChange={e => setRepBranch(e.target.value)}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"Lato,sans-serif", background:"#fff", cursor:"pointer" }}>
                <option value="">{repView==="cells" ? "All Cells" : "All Branches"}</option>
                {repView === "cells"
                  ? (cells||[]).filter(cl => !repDistrict || cl.district===repDistrict).map(cl => (
                      <option key={cl.name} value={cl.name}>{cl.name}{cl.district ? ` (${cl.district})` : ""}</option>
                    ))
                  : (branches||[]).filter(b => !repDistrict || b.district===repDistrict).map(b => (
                      <option key={b.name||b} value={b.name||b}>{b.name||b}{b.district ? ` (${b.district})` : ""}</option>
                    ))
                }
              </select>
            </div>
          )}
          {/* Capturer sees their assignment label */}
          {isCapturer && (
            <div style={{ background:C.bluePale, borderRadius:8, padding:"10px 16px", fontSize:14, fontWeight:700, color:C.blueDark }}>
              Showing: {user.cell ? `🔵 ${user.cell}` : `🏛️ ${user.branch}`}
            </div>
          )}
        </div>
      </Card>

      {/* KPI summary strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { label: "Total Services", value: totalsRow.services },
          { label: "Total Attendance", value: totalsRow.total.toLocaleString() },
          { label: "Adults", value: totalsRow.adults.toLocaleString() },
          { label: "Children", value: totalsRow.children.toLocaleString() },
          { label: "Salvations", value: totalsRow.salvations },
          { label: "Total Offerings", value: fmt$(totalsRow.offerings) },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ background: i === 0 ? C.blueDark : i === 1 ? C.blue : "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px", flex: "1 1 130px", minWidth: 120, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: (i <= 1) ? "rgba(255,255,255,0.7)" : C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: (i <= 1) ? "#fff" : C.blueDark }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card>
            <SectionTitle>Attendance Trend</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="adults"   name="Adults"   fill={C.blue}      radius={[4,4,0,0]} />
                <Bar dataKey="children" name="Children" fill={C.blueLight} radius={[4,4,0,0]} />
                <Bar dataKey="vip"      name="VIP"      fill={C.accent}    radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle>Offerings Trend</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => fmt$(v)} />
                <Line type="monotone" dataKey="offerings" name="Offerings" stroke={C.blue} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Summary Table */}
      <Card>
        <SectionTitle>{repType === "monthly" ? `Monthly Summary — ${repYear}` : "Year-on-Year Summary"} {repBranch ? `· ${repBranch}` : "· All Branches"}</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bluePale }}>
                {["Period","Services","Adults","VIP","Children","Total Att.","Salvations","Re-ded.","Offerings"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} style={{ borderBottom: `1px solid ${C.border}`, opacity: r.services === 0 ? 0.4 : 1 }}>
                  <td style={{ padding: "9px 12px", fontWeight: 700 }}>{r.label}</td>
                  <td style={{ padding: "9px 12px", color: C.muted }}>{r.services || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{r.adults || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{r.vip || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{r.children || "—"}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: C.blue }}>{r.total || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{r.salvations || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{r.rededications || "—"}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: C.blue }}>{r.offerings > 0 ? fmt$(r.offerings) : "—"}</td>
                </tr>
              ))}
              <tr style={{ background: C.blueDark }}>
                {["TOTAL", totalsRow.services, totalsRow.adults, totalsRow.vip, totalsRow.children, totalsRow.total, totalsRow.salvations, totalsRow.rededications, fmt$(totalsRow.offerings)].map((v, i) => (
                  <td key={i} style={{ padding: "10px 12px", fontWeight: 900, color: "#fff", fontSize: 13 }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [page, setPage]       = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [stats, setStats]       = useState([]);
  const [branches, setBranches]   = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cells, setCells]         = useState([]);

  // Load stats + branches from Supabase
  const loadData = async () => {
    try {
      const [s, b, d, cl] = await Promise.all([
        db.get("cc_stats",    "order=date.desc"),
        db.get("cc_branches", "order=name.asc"),
        db.get("cc_districts","order=name.asc"),
        db.get("cc_cells",    "order=name.asc"),
      ]);
      setStats(s);
      setBranches(b);
      setDistricts(d);
      setCells(cl);
    } catch (e) { console.error("Load error:", e); }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  // Login: query Supabase directly — works on every device
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const data = await db.get("cc_users", `email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&limit=1`);
      if (data.length) {
        const u = data[0];
        // Safety: if user has a cell assigned, clear branch from memory so it never bleeds into UI
        // Always: if cell is set, branch must be null — no matter what DB says
        const cleanUser = u.cell
          ? { ...u, branch: null, _assignedTo: "cell", _assignment: u.cell }
          : { ...u, cell: null,   _assignedTo: "branch", _assignment: u.branch };
        setUser(cleanUser); setPage("dashboard"); setLoading(false); return true;
      }
    } catch (e) { console.error("Login error:", e); }
    setLoading(false);
    return false;
  };

  if (loading) return <><style>{css}</style><Loader /></>;

  if (!user) return (
    <><style>{css}</style><LoginScreen onLogin={handleLogin} /></>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} user={user} onLogout={() => { setUser(null); setStats([]); setBranches([]); setDistricts([]); setCells([]); }} />
        <main className="main-content" style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
          {page === "dashboard"    && <DashboardPage    user={user} stats={stats} branches={branches} cells={cells} districts={districts} />}
          {page === "entry"        && <EntryPage        user={user} branches={branches} cells={cells} onSaved={loadData} />}
          {page === "consolidated" && (user.role === "admin" || user.role === "viewer") && <ConsolidatedPage user={user} stats={stats} branches={branches} cells={cells} districts={districts} />}
          {page === "reports"      && (user.role === "admin" || user.role === "viewer") && <ReportsPage user={user} stats={stats} branches={branches} cells={cells} districts={districts} />}
          {page === "cells-dashboard" && (user.role === "admin" || user.role === "viewer") && <CellsDashboardPage user={user} stats={stats} cells={cells} districts={districts} />}
          {page === "profile"      && <ProfilePage user={user} setUser={setUser} />}
          {page === "admin"        && user.role === "admin" && <AdminPage branches={branches} setBranches={setBranches} districts={districts} setDistricts={setDistricts} cells={cells} setCells={setCells} stats={stats} setStats={setStats} refreshAll={loadData} />}
        </main>
      </div>
    </>
  );
}
