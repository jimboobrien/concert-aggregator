# Direct JSON Import to Supabase

The Concert Aggregator now supports direct importing of JSON concert data to Supabase through a user-friendly interface. This feature allows you to quickly import data from existing JSON files without needing to use command line tools.

## Accessing the Import Interface

1. Navigate to the **Dashboard** section of the application
2. Click on the **Import** tab
3. Select the **Import from File** option

## Import Process

### Step 1: Select a JSON File

Click the file input field to open a file browser, or drag and drop a JSON file onto the input area. The system supports the following JSON formats:

- Standard format with a structure like: `{ json: { events: [...] } }`
- Simple array of events: `[{ title, date, url }]`
- Object with events array: `{ events: [...] }`

### Step 2: Select a Venue

Choose an existing venue from the dropdown menu to associate the imported events with. If the venue doesn't exist yet, select "Add New Venue" and enter a name for the new venue.

### Step 3: Import to Supabase

Click the "Import to Supabase" button to start the import process. The system will:

1. Validate the JSON file format
2. Normalize the data structure
3. Upload the events to Supabase
4. Display a success message with the number of imported events

## Data Normalization

During import, the system automatically normalizes your data to ensure consistency:

- Event dates are converted to ISO format
- Whitespace is trimmed from text fields
- URL fields are validated and normalized
- Import metadata (timestamp, source) is added

## Handling Duplicates

The import system includes intelligent duplicate detection:

- Events with the same title, date, and venue are identified as potential duplicates
- By default, newer data overwrites older data for duplicate events
- No duplicate records are created in the database

## Benefits of Direct Import

- **User-friendly**: No command line knowledge required
- **Instant feedback**: See the results of your import immediately
- **Venue management**: Create new venues on-the-fly during import
- **Error handling**: Clear error messages for invalid files
- **Normalized data**: Ensures consistent data structure in your database

## Troubleshooting

If you encounter issues during import:

- **Invalid JSON**: Ensure your file contains valid JSON syntax
- **Missing fields**: Check that your events have at least title and date fields
- **File size**: Large files may take longer to process
- **Network issues**: Retry if you experience connection problems

For technical support or to report issues, please contact the development team. 