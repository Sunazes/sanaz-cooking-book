#!/usr/bin/env python3
"""Build data/recipes.js from the Notion export in notion/.

notion/index.tsv  : id \t name \t tags(comma) \t course(comma)
notion/<id>.md    : page content with "# Normal version:" / "# healthy version:" sections
descriptions.json : {id: short Persian description}
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).parent
FA = str.maketrans("۰۱۲۳۴۵۶۷۸۹٫", "0123456789.")

def ascii_digits(s):
    return s.translate(FA)

# ---------- nutrition table: per 100 g (protein, carbs, fat) ----------
NUT = {
 "برنجپخته":(2.7,28,.3),"کته":(2.7,28,.3),"چلو":(2.7,28,.3),"برنج":(7,78,.6),"کینوا":(14,64,6),
 "جو":(13,66,7),"کورنفلکس":(7,84,1),"گرانولا":(10,64,15),"رایسکیک":(8,82,3),
 "آرد":(10,74,1.5),"آردنخودچی":(22,58,6),"نشاسته":(0,88,0),"سوخاری":(12,72,5),"بیکینگپودر":(0,0,0),"بکینگپودر":(0,0,0),
 "نان":(9,50,3),"لواش":(9,55,2),"تورتیلا":(8,50,7),"باگت":(9,55,2),"خمیر":(9,55,2),"یوفکا":(9,55,3),
 "اسپاگتی":(12,72,1.5),"ماکارونی":(12,72,1.5),"پاستا":(12,72,1.5),"پنه":(12,72,1.5),"فتوچینی":(12,72,1.5),
 "لینگوئینی":(12,72,1.5),"نودل":(12,72,2),"سوبا":(14,70,1),"لازانیا":(12,72,1.5),"رشته":(12,72,1.5),
 "سیبزمینی":(2,17,.1),"باقالی":(8,18,.5),"باقالیزرد":(26,58,1.5),"عدس":(25,60,1),"عدسپخته":(9,20,.4),
 "لپه":(24,60,1),"نخود":(19,61,6),"نخودپخته":(9,27,2.6),"نخودفرنگی":(5,14,.4),"ماش":(24,63,1),
 "لوبیاسبز":(1.8,7,.2),"لوبیا":(22,60,1.5),"لوبیاپخته":(8.7,22,.5),"لوبیاقرمزپخته":(8.7,22,.5),"لوبیاچیتیپخته":(9,26,.6),
 "ذرت":(3.3,19,1.4),"توفو":(8,2,5),
 "مرغ":(23,0,2),"سینهمرغ":(23,0,2),"رانمرغ":(19,0,8),"رانبیپوست":(20,0,4),"بالمرغ":(18,0,13),"فیلهمرغ":(23,0,2),
 "بوقلمون":(20,0,8),"گوشتچرخکرده":(18,0,18),"گوشت":(20,0,10),"کمچرب":(21,0,6),"بیچربی":(22,0,4),
 "راسته":(21,0,9),"گوساله":(20,0,10),"گوسفندی":(18,0,16),"خورشتی":(20,0,12),"فیلهگوساله":(21,0,8),"ماهیچه":(20,0,8),"ماهی":(20,0,5),"سالمون":(20,0,13),"قزلآلا":(20,0,6),
 "تنماهی":(25,0,8),"تنماهیدرآب":(25,0,1),"تندرآب":(25,0,1),"میگو":(24,0,1),"سوسیس":(12,3,25),"سوسیسمرغ":(15,4,12),
 "کالباس":(15,3,15),"ژامبون":(15,3,15),"بیکن":(15,3,35),
 "تخممرغ":(12.5,.7,10),"سفیده":(11,.7,.2),"زرده":(16,3.6,27),
 "شیرکمچرب":(3.4,5,1.5),"شیر":(3.3,4.8,3.3),"ماستیونانیکمچرب":(10,4,.4),"ماستیونانی":(9,4,5),
 "ماستکمچرب":(4,5,1.5),"ماست":(3.5,4.7,3.3),"ماستپرچرب":(3.5,4.7,6),"کشک":(13,8,5),"کشککمچرب":(15,8,2),
 "خامه":(2.5,3,30),"خامهترش":(2.5,4,20),"پنیرخامهای":(6,4,34),"پنیرخامهایسبک":(7,6,15),
 "کاتیج":(11,3,4),"ریکوتا":(11,3,13),"ریکوتایکمچرب":(11,4,8),"پارمزان":(35,3,28),"موزارلا":(22,2,22),
 "موزارلایکمچرب":(24,3,16),"پنیرپیتزا":(22,2,22),"فتا":(14,4,21),"فتایکمچرب":(17,4,10),"لیقوان":(14,4,21),
 "چدار":(25,1,33),"گودا":(25,1,30),"پنیر":(20,2,22),"پنیرکمچرب":(24,3,12),
 "کرهبادامزمینی":(25,20,50),"کره":(.8,0,81),"روغن":(0,0,100),"گی":(0,0,100),
 "مایونز":(1,1,75),"مایونزرژیمی":(1,8,30),"مایونزسبک":(1,8,30),
 "گردو":(15,14,65),"بادام":(21,22,50),"پسته":(20,28,45),"کاج":(14,13,68),"کنجد":(18,23,50),"ارده":(17,21,54),
 "دانه":(25,15,45),"چیا":(17,42,31),"کتان":(18,29,42),"هوموس":(8,14,10),"آووکادو":(2,9,15),"زیتون":(1,6,15),
 "شکر":(0,100,0),"عسل":(0,82,0),"شیره":(0,75,0),"خرما":(2,75,.4),"کشمش":(3,79,.5),"کرنبری":(0,82,1),
 "موز":(1.1,23,.3),"آلبالو":(1,12,.3),"آلو":(2,64,.4),"زرشک":(3,70,1),"میوه":(.8,10,.3),"توت":(.8,9,.3),"انار":(1.7,19,1),
 "کاکائو":(20,58,14),"وانیل":(0,0,0),"شیرنارگیل":(2,3,21),
 "ربگوجه":(4,19,.5),"ربانار":(0,60,0),"گوجه":(.9,3.9,.2),"پیاز":(1.1,9,.1),"سیر":(6,33,.5),"هویج":(.9,10,.2),
 "قارچ":(3,3,.3),"اسفناج":(2.9,3.6,.4),"کدوحلوایی":(1,7,.1),"کدو":(1.2,3,.3),"بادمجان":(1,6,.2),
 "فلفلدلمهای":(1,6,.3),"بروکلی":(2.8,7,.4),"گلکلم":(1.9,5,.3),"کلم":(1.3,6,.1),"کرفس":(.7,3,.2),
 "خیارشور":(.3,2,.2),"خیار":(.7,3.6,.1),"کاهو":(1.4,3,.2),"تربچه":(.7,3.4,.1),"جوانه":(3,6,.2),"مارچوبه":(2.2,4,.1),
 "سبزی":(3,6,.5),"جعفری":(3,6,.8),"گشنیز":(2,4,.5),"شوید":(3.5,7,1),"نعنا":(3.7,8,.9),"ریحان":(3,3,.6),"تره":(1.5,7,.3),
 "غوره":(.5,10,.2),"لیموعمانی":(0,0,0),"زنجبیل":(1.8,18,.8),
 "سسسویا":(8,5,0),"سستند":(1,2,0),"سسصدف":(1,22,0),"هویسین":(3,44,5),"کچاپ":(1,25,.2),"خردل":(4,6,4),"سسگوجه":(1.5,8,.5),
 "سریراچا":(1,20,1),"سرکه":(0,1,0),"آبلیمو":(.4,7,.2),"آبغوره":(0,3,0),"لیمو":(.4,7,.2),
 # zero-calorie / ignored
 "آب":(0,0,0),"آبجوش":(0,0,0),"آبمرغ":(0,0,0),"آبگوشت":(0,0,0),"آبپاستا":(0,0,0),"آبماکارونی":(0,0,0),
 "نمک":(0,0,0),"فلفل":(0,0,0),"زردچوبه":(0,0,0),"دارچین":(0,0,0),"زعفران":(0,0,0),"پاپریکا":(0,0,0),"زیره":(0,0,0),
 "آویشن":(0,0,0),"پونه":(0,0,0),"ادویه":(0,0,0),"کاری":(0,0,0),"گلپر":(0,0,0),"جوزهندی":(0,0,0),"هل":(0,0,0),
 "مخمر":(40,40,5),"جوششیرین":(0,0,0),"سیاهدانه":(18,40,22),"رزماری":(0,0,0),"برگبو":(0,0,0),"سماق":(0,0,0),
 "فلفلدلمهایکبابی":(1,6,.3),"فلفلسبز":(1,6,.3),"فلفلقرمز":(0,0,0),"پیازچه":(1.8,7,.2),"سیرسبز":(1.8,7,.2),
}

def norm(s):
    s = s.replace("‌ی", "").replace("‌", "").replace("ِ", "").replace("ي", "ی").replace("ك", "ک")
    s = re.sub(r"\s+", "", s)
    return s.replace("ئ", "ی").replace("ؤ", "و")

NUT_N = {norm(k): v for k, v in NUT.items()}
KEYS = sorted(NUT_N, key=len, reverse=True)

def lookup(text):
    """Earliest matching keyword wins; among those starting at the same place, the longest."""
    t = norm(text)
    best = None
    for k in KEYS:
        i = t.find(k)
        if i >= 0 and (best is None or i < best[1] or (i == best[1] and len(k) > len(best[0]))):
            best = (k, i)
    return NUT_N[best[0]] if best else None

def macros_from_ings(lines):
    P = C = F = 0.0
    for line in lines:
        line = ascii_digits(line)
        # commas inside parentheses are not item separators
        line = re.sub(r"\(([^)]*)\)", lambda m: "(" + m.group(1).replace("،", " ") + ")", line)
        for chunk in re.split(r"[،,+]", line):
            m = re.search(r"(\d+(?:\.\d+)?)\s*گرم", chunk)
            if not m:
                continue
            g = float(m.group(1))
            name = chunk[: m.start()]
            # "پیاز برای پخت مرغ: ۵۰ گرم" -> use the part before ":" when available
            if ":" in name:
                head, tail = name.split(":", 1)
                v = lookup(head) or lookup(tail)
            else:
                v = lookup(name)
            if v is None:
                v = lookup(chunk)
            if v:
                P += v[0] * g / 100; C += v[1] * g / 100; F += v[2] * g / 100
    return P, C, F

# ---------- parsing ----------
UNITLESS_AFTER = r"(?!\s*(?:درجه|سانت|٪|%|دقیقه|ساعت|ثانیه|برابر|بند))"

def parse_header(line, fallback):
    raw = line
    head = re.match(r"\*\*(.+?)\*\*\s*(.*)", line)
    bold, rest = (head.group(1), head.group(2)) if head else ("", line)
    title, yield_note, serv = fallback, "", 2
    sm = re.search(r"برای\s*([۰-۹\d]+)\s*نفر\s*(\(([^)]*)\))?", bold)
    if sm:
        serv = int(ascii_digits(sm.group(1)))
        yield_note = sm.group(3) or ""
    t = re.split(r"\s+—\s+", bold)[0].strip()
    if t and not t.startswith("برای"):
        title = t
    kcal = re.search(r"([۰-۹\d]+)\s*کالری", rest)
    prot = re.search(r"([۰-۹\d]+)\s*گرم پروتئین", rest)
    note = re.search(r"\(([^)]*)\)\s*$", rest)
    return {
        "title": title, "serv": serv, "yield": yield_note,
        "kcal": int(ascii_digits(kcal.group(1))) if kcal else None,
        "protein": int(ascii_digits(prot.group(1))) if prot else None,
        "kcalNote": note.group(1) if note else "",
    }

DUR = re.compile(
    r"(?:(\d+)\s*ساعت(?:\s*و\s*(\d+)\s*دقیقه)?)"
    r"|(?:(\d+)\s*تا\s*(\d+)\s*(دقیقه|ثانیه))"
    r"|(?:(\d+)\s*(دقیقه|ثانیه))"
)

def find_timers(text):
    """Return a list of {s: seconds, label: original text} for every duration in a step."""
    out = []
    t = ascii_digits(text)
    for m in DUR.finditer(t):
        if m.group(1):
            s = int(m.group(1)) * 3600 + int(m.group(2) or 0) * 60
        elif m.group(3):
            unit = 60 if m.group(5) == "دقیقه" else 1
            s = int(m.group(3)) * unit  # lower bound of a range; check doneness then
        else:
            unit = 60 if m.group(7) == "دقیقه" else 1
            s = int(m.group(6)) * unit
        if s > 0:
            out.append({"s": s, "label": m.group(0)})
    return out

def split_items(line):
    """'زردچوبه: ۲ گرم، نمک: ۵ گرم' -> two items; otherwise one item."""
    parts = [p.strip() for p in line.split("،")]
    if len(parts) > 1 and all(":" in p for p in parts):
        return parts
    return [line]

def to_item(text):
    text = text.strip()
    opt = "اختیاری" in text
    if ":" in text:
        n, a = text.split(":", 1)
        return {"n": n.strip(), "a": ascii_digits(a.strip()), "opt": opt}
    return {"n": ascii_digits(text), "a": "", "opt": opt}

def parse_version(block, fallback):
    lines = [l.rstrip() for l in block.split("\n")]
    hdr = next((l for l in lines if l.startswith("**") and ("نفر" in l or "کالری" in l)), "")
    v = parse_header(hdr, fallback) if hdr else {"title": fallback, "serv": 2, "yield": "", "kcal": None, "protein": None, "kcalNote": ""}
    ings, steps, notes, sources = [], [], [], []
    mode = None
    macro_lines = []
    for l in lines:
        s = l.strip()
        if not s or l == hdr:
            continue
        if s.startswith("**مواد لازم**"):
            mode = "ing"; continue
        if s.startswith("**طرز تهیه**"):
            mode = "step"; continue
        if s.startswith("**نکته:**"):
            notes.append(s.replace("**نکته:**", "").strip()); mode = None; continue
        if s.startswith("منبع"):
            sources += [{"t": t, "u": u} for t, u in re.findall(r"\[([^\]]+)\]\(([^)]+)\)", s)]
            continue
        if mode == "ing":
            gm = re.fullmatch(r"\*\*(.+?)\*\*", s)
            if gm:  # bold-only line = group header
                ings.append({"grp": gm.group(1).rstrip(":")}); continue
            m = re.match(r"(\t*)- (.*)", l)
            if not m:
                continue
            body = m.group(2)
            macro_lines.append(body)
            lab = re.match(r"\*\*(.+?):?\*\*\s*(.*)", body)
            if lab and not lab.group(2):          # "- **سس پستو:**" followed by indented items
                ings.append({"grp": lab.group(1).rstrip(":")}); continue
            if lab:                               # "- **سس:** a ۱۰ گرم، b ۲۰ گرم"
                ings.append({"n": lab.group(1).rstrip(":"), "a": ascii_digits(lab.group(2)), "opt": False}); continue
            for part in split_items(body):
                ings.append(to_item(part))
        elif mode == "step":
            m = re.match(r"(\t*)(?:(\d+)\.|-)\s+(.*)", l)
            if not m:
                continue
            txt = m.group(3).replace("**", "")
            if m.group(1) and steps:              # sub-bullet -> append to previous step
                steps[-1]["sub"].append(txt)
                steps[-1]["timers"] += find_timers(txt)
            else:
                steps.append({"c": txt, "sub": [], "timers": find_timers(txt)})
    P, C, F = macros_from_ings(macro_lines)
    serv = v["serv"] or 2
    p, c, f = P / serv, C / serv, F / serv
    kcal = v["kcal"]
    if kcal:
        if v["protein"]:
            p = float(v["protein"])
        rest = kcal - 4 * p
        cf = 4 * c + 9 * f
        if cf > 0 and rest > 0:
            k = rest / cf
            c, f = c * k, f * k
        elif rest > 0:
            c = rest / 8; f = rest / 18
    else:
        kcal = round(4 * p + 4 * c + 9 * f)
    v.update({
        "kcal": kcal,
        "macros": {"p": round(p), "c": round(c), "f": round(f)},
        "ings": ings, "steps": steps, "notes": notes, "sources": sources,
    })
    return v

def parse_page(md, name):
    parts = re.split(r"^# (?:Normal|healthy) version:\s*$", md, flags=re.M | re.I)
    if len(parts) < 3:
        raise ValueError(f"no versions in {name}")
    return parse_version(parts[1], name), parse_version(parts[2], name)

def main():
    desc = json.loads((ROOT / "descriptions.json").read_text("utf8"))
    out = []
    for row in (ROOT / "notion/index.tsv").read_text("utf8").strip().split("\n"):
        pid, name, tags, course = row.split("\t")
        md = (ROOT / f"notion/{pid}.md").read_text("utf8")
        normal, healthy = parse_page(md, name.strip())
        out.append({
            "id": pid, "name": name.strip(),
            "tags": [t for t in tags.split(",") if t],
            "course": [c for c in course.split(",") if c],
            "desc": desc.get(pid, ""),
            "notion": f"https://www.notion.so/{pid}",
            "normal": normal, "healthy": healthy,
        })
    (ROOT / "data").mkdir(exist_ok=True)
    js = "window.RECIPES = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "data/recipes.js").write_text(js, "utf8")
    # cache-busting: stamp asset URLs in index.html with a content hash
    import hashlib
    html_p = ROOT / "index.html"
    html = html_p.read_text("utf8")
    for asset in ("data/recipes.js", "app.js", "style.css"):
        h = hashlib.md5((ROOT / asset).read_bytes()).hexdigest()[:8]
        html = re.sub(re.escape(asset) + r'(\?v=\w+)?"', f'{asset}?v={h}"', html)
    html_p.write_text(html, "utf8")
    missing = [r["name"] for r in out if not r["desc"]]
    print(f"{len(out)} recipes -> data/recipes.js ({len(js)//1024} KB)")
    if missing:
        print("missing descriptions:", len(missing))

if __name__ == "__main__":
    main()
