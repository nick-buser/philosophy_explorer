namespace PhilosophyExplorer.Db

open System
open System.Data
open System.Data.Common
open Microsoft.Data.Sqlite
open Npgsql

/// DB connection factory — mirrors packages/api/src/db/index.ts strategy pattern.
/// Dialect is auto-detected from DATABASE_URL:
///   file:./dev.db or :memory:  → SQLite
///   postgresql://...           → Postgres
module DbFactory =

    type DbDialect =
        | SQLite
        | Postgres

    let private databaseUrl =
        Environment.GetEnvironmentVariable("DATABASE_URL")
        |> Option.ofObj
        |> Option.defaultValue "file:./dev.db"

    let dialect =
        if databaseUrl.StartsWith("file:") || databaseUrl.StartsWith(":memory:") then
            SQLite
        else
            Postgres

    let createConnection () : IDbConnection =
        match dialect with
        | SQLite ->
            let connStr =
                if databaseUrl.StartsWith("file:") then
                    let path = databaseUrl.Substring(5)
                    $"Data Source={path}"
                else
                    $"Data Source={databaseUrl}"
            new SqliteConnection(connStr) :> IDbConnection
        | Postgres ->
            new NpgsqlConnection(databaseUrl) :> IDbConnection

    let testConnection () =
        task {
            use conn = createConnection ()
            conn.Open()
            use cmd = conn.CreateCommand()
            cmd.CommandText <- "SELECT 1"
            cmd.ExecuteScalar() |> ignore
            return ()
        }
