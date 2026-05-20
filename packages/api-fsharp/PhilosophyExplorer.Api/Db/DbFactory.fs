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

    /// Npgsql's connection-string parser accepts only key-value form
    /// (`Host=...;Username=...`), not the `postgresql://user:pw@host/db` URL
    /// that psycopg / postgres-js take. DATABASE_URL is a URL by homelab
    /// convention, so translate it here; a non-URL string passes through.
    let toNpgsqlConnectionString (url: string) : string =
        if url.Contains("://") then
            let uri = Uri(url)
            let userInfo = uri.UserInfo.Split(':', 2)
            let builder = NpgsqlConnectionStringBuilder()
            builder.Host <- uri.Host
            builder.Port <- (if uri.Port > 0 then uri.Port else 5432)
            builder.Username <- Uri.UnescapeDataString(userInfo.[0])
            if userInfo.Length > 1 then
                builder.Password <- Uri.UnescapeDataString(userInfo.[1])
            builder.Database <- Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'))
            builder.ConnectionString
        else
            url

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
            new NpgsqlConnection(toNpgsqlConnectionString databaseUrl) :> IDbConnection

    let testConnection () =
        task {
            use conn = createConnection ()
            conn.Open()
            use cmd = conn.CreateCommand()
            cmd.CommandText <- "SELECT 1"
            cmd.ExecuteScalar() |> ignore
            return ()
        }
