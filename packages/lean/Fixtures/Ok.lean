import Sanity

-- Verified-path fixture. Referencing the built `Sanity` library means a
-- passing run also proves `import` resolution through `lake env`.
theorem health : True := ok
