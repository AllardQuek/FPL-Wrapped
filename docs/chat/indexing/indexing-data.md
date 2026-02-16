Here's the **step-by-step process** to index Fantasy Premier League data into Elasticsearch:

## 📋 **Step-by-Step Guide**

### **Step 1: Understand the FPL API**
The FPL API is publicly available at:
- **Bootstrap/static data**: `https://fantasy.premierleague.com/api/bootstrap-static/`
- **Fixtures**: `https://fantasy.premierleague.com/api/fixtures/`
- **Player gameweek data**: `https://fantasy.premierleague.com/api/element-summary/{player_id}/`
- **Manager data**: `https://fantasy.premierleague.com/api/entry/{manager_id}/`

### **Step 2: Design Your Index Mapping**
Create a mapping that defines field types before ingesting data:

```json
PUT /fpl-players
{
  "mappings": {
    "properties": {
      "player_id": { "type": "integer" },
      "name": { "type": "text", "fields": { "keyword": { "type": "keyword" }}},
      "team": { "type": "keyword" },
      "position": { "type": "keyword" },
      "price": { "type": "float" },
      "total_points": { "type": "integer" },
      "form": { "type": "float" },
      "selected_by_percent": { "type": "float" },
      "gameweek_history": { "type": "nested" },
      "@timestamp": { "type": "date" }
    }
  }
}
```

### **Step 3: Fetch Data from FPL API**
Use Python to retrieve the data:

```python
import requests
import json

# Fetch bootstrap data (players, teams, gameweeks)
response = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/')
fpl_data = response.json()

players = fpl_data['elements']
teams = fpl_data['teams']
gameweeks = fpl_data['events']
```

### **Step 4: Transform Data for Elasticsearch**
Format the data to match your mapping:

```python
from datetime import datetime

def transform_player(player, teams_dict):
    return {
        "player_id": player['id'],
        "name": f"{player['first_name']} {player['second_name']}",
        "team": teams_dict[player['team']]['name'],
        "position": get_position(player['element_type']),
        "price": player['now_cost'] / 10,  # Price is in tenths
        "total_points": player['total_points'],
        "form": float(player['form']),
        "selected_by_percent": float(player['selected_by_percent']),
        "goals_scored": player['goals_scored'],
        "assists": player['assists'],
        "clean_sheets": player['clean_sheets'],
        "@timestamp": datetime.utcnow().isoformat()
    }

# Create teams lookup
teams_dict = {team['id']: team for team in teams}

# Transform all players
transformed_players = [transform_player(p, teams_dict) for p in players]
```

### **Step 5: Connect to Elasticsearch**
Install the Python client and establish connection:

```bash
pip install elasticsearch
```

```python
from elasticsearch import Elasticsearch

# Connect to your Elasticsearch instance
es = Elasticsearch(
    ['https://your-elasticsearch-url:9200'],
    basic_auth=('username', 'password'),  # or use api_key
    verify_certs=True
)

# Test connection
print(es.info())
```

### **Step 6: Bulk Index the Data**
Use bulk API for efficient indexing:

```python
from elasticsearch.helpers import bulk

def generate_actions(players, index_name):
    for player in players:
        yield {
            "_index": index_name,
            "_id": player['player_id'],  # Use player_id as document ID
            "_source": player
        }

# Bulk index
success, failed = bulk(es, generate_actions(transformed_players, 'fpl-players'))
print(f"Indexed {success} documents, {failed} failed")
```

### **Step 7: Verify the Data**
Check that data was indexed correctly:

```python
# Count documents
count = es.count(index='fpl-players')
print(f"Total documents: {count['count']}")

# Search for a specific player
result = es.search(
    index='fpl-players',
    body={
        "query": {
            "match": {
                "name": "Salah"
            }
        }
    }
)
print(result['hits']['hits'])
```

### **Step 8: Set Up Automated Updates**
Create a scheduled script to refresh data regularly:

```python
import schedule
import time

def update_fpl_data():
    print("Fetching latest FPL data...")
    response = requests.get('https://fantasy.premierleague.com/api/bootstrap-static/')
    fpl_data = response.json()
    
    # Transform and index
    players = fpl_data['elements']
    teams_dict = {team['id']: team for team in fpl_data['teams']}
    transformed = [transform_player(p, teams_dict) for p in players]
    
    # Bulk index with update
    success, failed = bulk(es, generate_actions(transformed, 'fpl-players'))
    print(f"Updated {success} documents")

# Schedule updates
schedule.every().day.at("02:00").do(update_fpl_data)  # Run daily at 2 AM
schedule.every().hour.do(update_fpl_data)  # Or hourly during gameweeks

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 🎯 **Alternative Methods**

### **Using Logstash**
Create a Logstash config to pull and index FPL data:

```ruby
input {
  http_poller {
    urls => {
      fpl => "https://fantasy.premierleague.com/api/bootstrap-static/"
    }
    schedule => { cron => "0 */6 * * *" }  # Every 6 hours
    codec => "json"
  }
}

filter {
  split {
    field => "[elements]"
  }
  mutate {
    rename => { "[elements]" => "player" }
  }
}

output {
  elasticsearch {
    hosts => ["https://your-elasticsearch-url:9200"]
    index => "fpl-players-%{+YYYY.MM.dd}"
    user => "username"
    password => "password"
  }
}
```

### **Using Filebeat + Python Script**
1. Python script writes FPL data to JSON files
2. Filebeat monitors the directory and ships to Elasticsearch

## 📊 **Bonus: Create Index Templates**
For time-series data (gameweek history), use index templates:

```json
PUT /_index_template/fpl-gameweeks-template
{
  "index_patterns": ["fpl-gameweeks-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "gameweek": { "type": "integer" },
        "player_id": { "type": "integer" },
        "points": { "type": "integer" },
        "goals": { "type": "integer" },
        "assists": { "type": "integer" },
        "@timestamp": { "type": "date" }
      }
    }
  }
}
```

## ✅ **Quick Start Summary**
1. **Design mapping** → Define your data structure
2. **Fetch API data** → Use Python requests
3. **Transform data** → Format for Elasticsearch
4. **Connect to ES** → Use Python client
5. **Bulk index** → Load data efficiently
6. **Automate** → Schedule regular updates
7. **Visualize** → Create Kibana dashboards

This approach gives you a robust, scalable FPL data pipeline in Elasticsearch!