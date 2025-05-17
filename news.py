import requests

def fetch_newsapi_headlines(api_key, query="climate OR weather", filename="news.html"):
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}&"
        f"language=en&"
        f"sortBy=publishedAt&"
        f"pageSize=10&"
        f"apiKey={api_key}"
    )
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()
    articles = data.get("articles", [])
    headlines = [(article["title"], article["url"]) for article in articles]
    save_headlines_to_html(headlines, filename)

def save_headlines_to_html(headlines, filename="news.html"):
    with open(filename, "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Latest Climate News</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f4f8; color: #222; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; padding: 2em; border-radius: 10px; box-shadow: 0 2px 8px #ccc; }
        h1 { color: #008080; }
        ul { padding-left: 1.2em; }
        li { margin-bottom: 1em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Latest Climate News Headlines from NewsAPI.org</h1>
        <ul>
""")
        for title, url in headlines:
            f.write(f'            <li><a href="{url}" target="_blank">{title}</a></li>\n')
        f.write("""        </ul>
    </div>
</body>
</html>""")

if __name__ == "__main__":
    NEWSAPI_KEY = "95099bbd8c8145b192193a44211af20e"  # Replace with your NewsAPI.org key
    fetch_newsapi_headlines(NEWSAPI_KEY)
    print("Headlines have been saved to news.html")