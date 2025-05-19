# Database monitor

Command line utility to watch and log changes in a database, with rollback functionality.

## Using the utility

In order to just *use* this utility, you need to build it once, then it can be run either from this folder, or you can install a global alias.

### Setup

A single command to install and build:

```sh
yarn setup
```

This just launches a shell script which does the following:

```sh
yarn # install dependencies

yarn build # compile the app into `./dist` 
```
And you'll be given a command which you can add to your shell configuration file to create a global alias.

### Run it

The following commands refer to running the (compiled) app from within this repo. But if running from elsewhere (using the global alias), swap out the `yarn monitor` with the alias `db_monitor`:

#### Load configuration

```sh
yarn monitor config <path-to-your-config-json-file>
```

A configuration JSON file is required, which defines your database connection as well as several other possible customisations. This command tells the app where to find this file for future commands, so you don't have to specify it for every command.

A minimal config file requires the database connection details, for example (in `configs/example.json`):
```json
{
  "dbInterface": "postgres",
  "dbConfig": {
    "user": "postgres",
    "host": "localhost",
    "database": "my_database",
    "port": 5432
  }
}
```

See [Configuration file](#configuration-file) for detailed breakdown of configuration options.


#### Start

```sh
yarn monitor start
```

This starts the main database watch process: triggers are added to all tables, and a separate schema (`db_monitor`) is created with a log table. You should see database changes printed to the console as they happen.

Stop the process with **`Ctrl-C`**, or by running `yarn monitor stop` from another terminal.

#### Reset

```sh
yarn monitor reset
```
Removes the watch schema and added triggers, returning the database schema to its original state.

#### Rollback

```sh
yarn monitor rollback <event-number / checkpoint-name>
```

Event numbers are displayed in the header of each database change printed to the console. When you rollback to a given event, the database will be reverted to the state it was in *before* this event.

You can also specify a pre-configured [checkpoint](#checkpoint) instead of an event number.

#### Checkpoint

```sh
yarn monitor checkpoint <name>
```

If you wish to rollback the database to a given point several times over, you can mark a **checkpoint**, which makes it easier than keeping track of event numbers.

#### Status

```sh
yarn monitor status
```

Print a summary of the current status of the watch schema activity. 

Example output:

```
Database monitor
 - Schema: db_monitor
 - Log table: log
 - Checkpoint table: checkpoint
 - Status table: status

Logging is currently: ACTIVE

2349 entries currently in log

Rollback checkpoints available:
 - restart
 - test
 - etc...
```

#### Shortcut

All the above commands can be shortened to just `yarn mon` for convenience.

## Running in dev mode

To use in development from this repo, just replace `yarn monitor` with `yarn dev` in the above commands. 

For the `start` command, however, you can run `yarn start`, which launches the watch process with hot-reloading -- any code changes relaunch the app immediately on save.

## Configuration file

Here is the type definition (in `src/types.ts`):

```ts
interface ConfigFile {
  dbInterface: 'postgres'
  dbConfig: Record<string, unknown>
  schemasToWatch: string[] // default [ "public" ]
  ignoreTables?: string[]
  additionalSetupSql?: string
  // These values have defaults in constants.ts
  logSchemaName?: string
  logTableName?: string
  checkpointTableName?: string
  statusTableName?: string
  // Formatting
  maxFields?: number
  lineLength?: number
  maxLines?: number // per field
  formatters?: Record<string, Formatter>
  // Console styles (using chalk)
  styles?: ChalkStyleStrings
}
```

Going through each property one by one:

### Database setup

- `dbInterface`: Currently only "postgres" is supported, but other databases can be added by creating a class that implements the `DatabaseInterface` (in `src/database/types.ts`)
- `dbConfig`: The configuration options required for connecting to the database. We're using [node-postgres](https://node-postgres.com/) to interact with Postgres, so this config should be a [`ClientConfig`](https://node-postgres.com/apis/client#new-client) object.
- `schemasToWatch`: an array of schema names. If not specified, we default to `["public"]`.
- `ignoreTables`: an array of table names (within the previously specified schemas) to *not* watch and log.
- `additionalSetupSql`: Some additional setup scaffolding might be required to get this to work with your database (for example granting user permissions to the new `db_monitor` schema). If so, put it here as an SQL string.

### Overriding database names

- `logSchemaName`: name of the schema created to record the database logs. Default: `db_monitor`
- `logTableName`: name of the main table where database changes are logged. Default: `log`
- `checkpointTableName` the table where [checkpoints](#checkpoint) are stored. Default `checkpoint`
- `statusTableName`: name of the table where the current database logging status is stored. Default: `status`

### Formatting

These settings describe how the database events are presented in the console. The defaults should be acceptable in most cases.

- `maxFields`: The maximum number of fields/column values to display per event. Tables that have more fields than this will display *...plus X more fields* after the last shown one. Default: `12`
- `lineLength`: Long values will be wrapped at this line length. Default: `70`
- `maxLines`: The maximum number of lines (of length `lineLength`) to display for a *single field*. For any values longer than this the text *...(more)* will appear after the maximum lines. Default: `5`
- `formatters`: Similar to the above, but *per table*. Input is object with table names as keys, and the value is an object with the following (all optional) fields:
  - `maxFields`, `lineLength`, `maxLines`: same as above, but just for this table
  - `include`: an array of fields/columns to include in the display. If `include` is not provided, we show all fields (taking into account the `maxFields` and `exclude` properties)
  - `exclude` an array of fields/columns to explicitly *exclude* from display  
  ```js
  // Example `formatters` definition:
  formatters: {
    user: {
        maxLines: 2
        // Note that the primary key field/value will *always* be displayed separate from the fields themselves
        include: ["username", "email", "address", "date_of_birth"]
    },
    invoice: {
        exclude: ["name_store_id", "user_id", "store_id", "clinical_link_id"],
        maxFields: 8,
    }
  }
  ```
- `styles`: the colours and font-styles to display records in the console. We use [chalk](https://www.npmjs.com/package/chalk) to handle the formatting, so the `styles` object consists of keys corresponding to specific text elements, and the values are strings representing the chained `chalk` methods that format them, as defined by [chalk-pipe](https://www.npmjs.com/package/chalk-pipe).  
Here is the default styles object -- you only need to provide the properties you wish to override:
```js
{
  eventNum: "bold.red",
  timestamp: "blue",
  operationDelete: "#ff0000", // hex value for pure red
  operationInsert: "#00ff00", // bright green
  operationUpdate: "#ffee00", // bright yellow
  tableName: "greenBright",
  primaryKey: "blueBright",
  primaryValue: "yellow.bold",
  sourceDestination: "bold",
  fieldName: "bold",
  string: "green",
  number: "yellow",
  boolean: "magenta.italic",
  json: "gray",
  null: "dim",
  date: "magenta",
  more: "italic.dim",
  moreFields: "italic.cyan",
}
```
