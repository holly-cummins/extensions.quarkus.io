jest.setTimeout(25 * 1000)

const { port } = require("../jest-puppeteer.config").server

const siteRoot = `http://localhost:${port}/${process.env.PATH_PREFIX || ""}`

describe("extension JSON endpoint", () => {
  let response
  let jsonData

  // Use a stable, well-known extension for testing
  beforeAll(async () => {
    const url = `${siteRoot}/io.quarkus/quarkus-hibernate-orm/info.json`
    response = await page.goto(url)
    const text = await response.text()
    jsonData = JSON.parse(text)
  })

  it("should return 200 OK", () => {
    expect(response.status()).toBe(200)
  })

  it("should have Content-Type application/json", () => {
    const contentType = response.headers()["content-type"]
    expect(contentType).toContain("application/json")
  })

  it("should include base registry fields", () => {
    expect(jsonData).toHaveProperty("name")
    expect(jsonData).toHaveProperty("description")
    expect(jsonData).toHaveProperty("artifact")
  })

  it("should include the extension name", () => {
    expect(jsonData.name).toBe("Hibernate ORM")
  })

  it("should include metadata", () => {
    expect(jsonData).toHaveProperty("metadata")
    expect(jsonData.metadata).toBeDefined()
  })

  it("should include status in metadata", () => {
    expect(jsonData.metadata).toHaveProperty("status")
    expect(Array.isArray(jsonData.metadata.status)).toBe(true)
  })

  it("should include categories in metadata", () => {
    expect(jsonData.metadata).toHaveProperty("categories")
    expect(Array.isArray(jsonData.metadata.categories)).toBe(true)
  })

  describe("enriched maven metadata (not in registry)", () => {
    it("should include maven information", () => {
      expect(jsonData.metadata).toHaveProperty("maven")
      expect(jsonData.metadata.maven).toBeDefined()
    })

    it("should include maven version", () => {
      expect(jsonData.metadata.maven).toHaveProperty("version")
      expect(jsonData.metadata.maven.version).toBeDefined()
    })

    it("should include maven coordinates", () => {
      expect(jsonData.metadata.maven).toHaveProperty("groupId")
      expect(jsonData.metadata.maven).toHaveProperty("artifactId")
    })

    it("should include maven URL", () => {
      expect(jsonData.metadata.maven).toHaveProperty("url")
      expect(jsonData.metadata.maven.url).toBeDefined()
    })

    it("should include 'since' timestamp - the key enrichment field from issue #3387", () => {
      expect(jsonData.metadata.maven).toHaveProperty("since")
      expect(jsonData.metadata.maven.since).toBeDefined()
    })

    it("should include sinceMonth and sinceYear", () => {
      expect(jsonData.metadata.maven).toHaveProperty("sinceMonth")
      expect(jsonData.metadata.maven).toHaveProperty("sinceYear")
    })

    it("should include timestamp", () => {
      expect(jsonData.metadata.maven).toHaveProperty("timestamp")
      expect(jsonData.metadata.maven.timestamp).toBeDefined()
    })
  })

  describe("enriched source control metadata (not in registry)", () => {
    it("should include source control information as 'scm'", () => {
      expect(jsonData.metadata).toHaveProperty("scm")

      // Verify structure when present
      expect(jsonData.metadata.scm?.repository).toBeTruthy()
      expect(jsonData.metadata.scm.repository).toHaveProperty("url")
      expect(jsonData.metadata.scm.repository).toHaveProperty("owner")
      expect(jsonData.metadata.scm.repository).toHaveProperty("project")
    })

    it("should include issue count", () => {
      expect(jsonData.metadata.scm).toHaveProperty("issues")
    })

    it("should include contributors array", () => {
      expect(jsonData.metadata.scm).toHaveProperty("contributors")
      expect(Array.isArray(jsonData.metadata.scm.contributors)).toBe(true)

      // Verify contributor structure for well-known extension
      expect(jsonData.metadata.scm.contributors.length).toBeGreaterThan(0)
      const contributor = jsonData.metadata.scm.contributors[0]
      expect(contributor).toHaveProperty("name")
      expect(contributor).toHaveProperty("contributions")
    })
  })

  describe("enriched download ranking (not in registry)", () => {
    it("should include downloads field as undefined or object with rank", () => {
      const downloads = jsonData.metadata.downloads
      // downloads is optional - it may be undefined or have the correct structure
      const isValid = downloads === undefined || (
        typeof downloads === "object" &&
        downloads !== null &&
        typeof downloads.rank === "number" &&
        typeof downloads.artifactId === "string" &&
        typeof downloads.uniqueId === "string"
      )
      expect(isValid).toBe(true)
    })
  })

  describe("registry-compatible field naming", () => {
    it("should use 'built-with-quarkus-core' (registry format)", () => {
      expect(jsonData.metadata).toHaveProperty("built-with-quarkus-core")
    })

    it("should use 'quarkus-core-compatibility' (registry format)", () => {
      expect(jsonData.metadata).toHaveProperty("quarkus-core-compatibility")
    })

    it("should use 'minimum-java-version' (registry format)", () => {
      expect(jsonData.metadata).toHaveProperty("minimum-java-version")
    })

    it("should use 'icon-url' field when icon exists", () => {
      const iconUrl = jsonData.metadata["icon-url"]
      // icon-url is optional - it may be undefined or a string
      const isValid = iconUrl === undefined || typeof iconUrl === "string"
      expect(isValid).toBe(true)
    })
  })

  describe("other enriched fields (not in registry)", () => {
    it("should include guide URL", () => {
      expect(jsonData.metadata).toHaveProperty("guide")
    })

    it("should include platforms", () => {
      expect(jsonData).toHaveProperty("platforms")
      expect(Array.isArray(jsonData.platforms)).toBe(true)
    })

    it("should include streams", () => {
      expect(jsonData).toHaveProperty("streams")
      expect(Array.isArray(jsonData.streams)).toBe(true)
    })
  })

  describe("registry base fields", () => {
    it("should include keywords", () => {
      expect(jsonData.metadata).toHaveProperty("keywords")
    })

    it("should include origins", () => {
      expect(jsonData).toHaveProperty("origins")
      expect(Array.isArray(jsonData.origins)).toBe(true)
    })
  })


  describe("duplicate/superseded information (not in registry)", () => {
    it("should include isSuperseded flag", () => {
      expect(jsonData).toHaveProperty("isSuperseded")
      expect(typeof jsonData.isSuperseded).toBe("boolean")
    })

    it("should include duplicates as an array or undefined", () => {
      // duplicates can be undefined or an array
      const duplicates = jsonData.duplicates
      expect(duplicates === undefined || Array.isArray(duplicates)).toBe(true)
    })
  })
})

describe("extension JSON endpoint for different extensions", () => {
  it("should work for extensions with different group IDs", async () => {
    // Test with another stable extension
    const url = `${siteRoot}/io.quarkus/quarkus-resteasy/info.json`
    const response = await page.goto(url)
    expect(response.status()).toBe(200)

    const text = await response.text()
    const jsonData = JSON.parse(text)

    expect(jsonData).toHaveProperty("name")
    expect(jsonData).toHaveProperty("metadata")
  })

  it("should return 404 for non-existent extensions", async () => {
    const url = `${siteRoot}/io.nonexistent/fake-extension/info.json`
    const response = await page.goto(url)
    expect(response.status()).toBe(404)
  })
})
