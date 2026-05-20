module PhilosophyExplorer.Tests.DbFactoryTests

open Xunit
open Npgsql
open PhilosophyExplorer.Db

// Npgsql's connection-string parser accepts only key-value form, not the
// postgresql:// URL that DATABASE_URL carries by homelab convention.
// DbFactory.toNpgsqlConnectionString bridges the two; these exercise the
// translation without needing a live database.

[<Fact>]
let ``postgresql URL is translated to Npgsql key-value form`` () =
    let cs =
        DbFactory.toNpgsqlConnectionString
            "postgresql://pe_user:s3cret@192.168.1.12:5432/philosophy_explorer_dev"
    let b = NpgsqlConnectionStringBuilder(cs)
    Assert.Equal("192.168.1.12", b.Host)
    Assert.Equal(5432, b.Port)
    Assert.Equal("pe_user", b.Username)
    Assert.Equal("s3cret", b.Password)
    Assert.Equal("philosophy_explorer_dev", b.Database)

[<Fact>]
let ``percent-encoded characters in the password are decoded`` () =
    // scaffolded passwords are base64 — '+' '/' '=' arrive percent-encoded
    let cs =
        DbFactory.toNpgsqlConnectionString
            "postgresql://pe_user:ab%2Bcd%2Fef%3D@host:5432/db"
    let b = NpgsqlConnectionStringBuilder(cs)
    Assert.Equal("ab+cd/ef=", b.Password)

[<Fact>]
let ``the translated string is one NpgsqlConnection accepts`` () =
    let cs = DbFactory.toNpgsqlConnectionString "postgresql://u:p@host:5432/db"
    // NpgsqlConnection's constructor throws ArgumentException on a URL;
    // it must not throw on the translated key-value string.
    use conn = new NpgsqlConnection(cs)
    Assert.NotNull(conn)

[<Fact>]
let ``a key-value connection string passes through unchanged`` () =
    let kv = "Host=h;Port=5432;Username=u;Password=p;Database=d"
    Assert.Equal(kv, DbFactory.toNpgsqlConnectionString kv)

[<Fact>]
let ``the port defaults to 5432 when the URL omits it`` () =
    let cs = DbFactory.toNpgsqlConnectionString "postgresql://u:p@host/db"
    let b = NpgsqlConnectionStringBuilder(cs)
    Assert.Equal(5432, b.Port)
