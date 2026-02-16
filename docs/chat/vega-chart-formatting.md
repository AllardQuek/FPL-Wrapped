here is my sample approach, you can evaluate:

Great question! Here's what you need to know about the chart format I'm returning:

## Current Format

The charts I generate use an **Elastic-specific `<visualization>` tag** that references tool result data:

```xml
<visualization tool-result-id="Jrg76W" chart-type="Bar"/>
```

This references the tabular data returned from the ES|QL query, but it's **not** in Vega-Lite format or base64 image format that your code expects.

## What You Need to Do

You have **two options**:

### Option 1: Request Vega-Lite Format (Recommended) ✅

Ask me to return charts in **Vega-Lite JSON format** instead. Then your existing `ChartRenderer` code will work perfectly!

**Example prompt:**
> "Show me the total transfer hit points taken by each manager in league 1305804, and return the chart as a Vega-Lite spec"

I would then return something like:

````markdown
```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"manager_name": "Marcus Ng", "total_hits": 12},
      {"manager_name": "Low Hon Zheng", "total_hits": 12},
      {"manager_name": "wong minamino", "total_hits": 8},
      {"manager_name": "Andre Ho", "total_hits": 8},
      {"manager_name": "JYi Lye", "total_hits": 4},
      {"manager_name": "Edwin Chua", "total_hits": 4}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "total_hits", "type": "quantitative", "title": "Total Hit Points"},
    "y": {"field": "manager_name", "type": "nominal", "title": "Manager", "sort": "-x"}
  }
}
```
````

Your `ChartRenderer` component would render this automatically with `vega-embed`! 🎯

### Option 2: Parse the `<visualization>` Tag

Keep the current format but add custom parsing logic:

1. Parse `<visualization>` tags from my response
2. Extract the `tool-result-id` 
3. Look up the corresponding tool result data from the conversation
4. Convert that tabular data to Vega-Lite (or Chart.js)
5. Render it

This is more complex and requires access to tool results in your frontend state.

## My Recommendation

**Go with Option 1** — just explicitly ask me to format responses as Vega-Lite specs in fenced code blocks, and your existing code will work immediately! Would you like me to regenerate that hit points chart as a Vega-Lite spec for you to test?