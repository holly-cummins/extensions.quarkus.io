import {
  clearCaches,
  findSponsor,
  findSponsorFromContributorList,
  normalizeCompanyName,
  setMinimumContributionCount,
  setMinimumContributionPercent,
  setMinimumContributorCount,
} from "./sponsorFinder"

require("jest-fetch-mock").enableMocks()

const urls = {}

// Mock users (for contributor lists)

const exampleContributor = {
  login: "holly-cummins",
  company: "Red Hat",
  contributions: 9,
}

const anotherContributor = {
  login: "another-contributor",
  company: "Another Company",
  contributions: 9,
}

const occasionalContributor = {
  login: "occasional-contributor",
  company: "Occasional Company",
  contributions: 44,
}

const pactContributors = [
  {
    login: "holly-cummins",
    company: "@RedHatOfficial",
    contributions: 68,
  },
  {
    login: "dependabot[bot]",
    site_admin: false,
    contributions: 27,
  },
  {
    login: "actions-user",
    contributions: 21,
  },
  {
    login: "allcontributors[bot]",
    contributions: 10,
  },
  {
    login: "gastaldi",
    contributions: 5,
  },
  {
    login: "michalvavrik",
    contributions: 1,
  },
]

const companyWithASingleContributor = "Company With A Single Contributor"
const manyContributors = [
  occasionalContributor,
  occasionalContributor,
  {
    login: "solo-contributor",
    company: companyWithASingleContributor,
    contributions: 109,
  },
  {
    login: "holly-cummins",
    company: "Red Hat",
    contributions: 33,
  },
  {
    login: "dependabot[bot]",
    contributions: 27,
  },
  anotherContributor,
  exampleContributor,
  anotherContributor,
  anotherContributor,
  anotherContributor,
  anotherContributor,
  exampleContributor,
  {
    login: "another-contributor",
    company: "Another Company",
    contributions: 19,
  },
  {
    login: "redhat-employee",
    company: "@RedHatOfficial",
    contributions: 9,
  },
]

const anotherContributors =
  [
    {
      login: "redhat-employee",
      company: "@RedHatOfficial",
      contributions: 68,
    },
  ]

// Mock company information

urls["https://api.github.com/users/redhatofficial"] = {
  login: "RedHatOfficial",
  type: "Organization",
  name: "Red Hat",
  company: null,
}

const frogNode = {
  "node": {
    "author": {
      "user": {
        "login": "cescoffier",
        "company": "Red Hat"
      }
    }
  }
}
const rabbitNode = {
  "node": {
    "author": {
      "user": {
        "login": "ozangunalp",
        "company": "Rabbit"
      }
    }
  }
}

const tortoiseNode = {
  "node": {
    "author": {
      "user": {
        "login": "a-name",
        "company": "Tortoise"
      }
    }
  }
}

const nullUserNode = {
  "node": {
    "author": {
      "user": null
    }
  }
}

const graphQLResponse = {
  "data": {
    "repository": {
      "defaultBranchRef": {
        "target": {
          "history": {
            "edges": [
              rabbitNode, tortoiseNode, frogNode, tortoiseNode, rabbitNode, rabbitNode, rabbitNode, rabbitNode, nullUserNode, frogNode, frogNode
            ]
          }
        }
      }
    }
  }
}

urls["https://api.github.com/graphql"] = graphQLResponse


describe("the github sponsor finder", () => {
  beforeAll(async () => {
    // Needed so that we do not short circuit the git path
    process.env.GITHUB_TOKEN = "test_value"
    
    setMinimumContributorCount(1)

    fetch.mockImplementation(url =>
      Promise.resolve({
        json: jest
          .fn()
          .mockResolvedValue(urls[url] || urls[url.toLowerCase()] || {}),
      })
    )
  })

  beforeEach(() => {
    clearCaches()
  })

  afterAll(() => {
    delete process.env.GITHUB_TOKEN
    fetch.resetMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("does not make fetch calls if the org is undefined", async () => {
    const sponsor = await findSponsor(undefined, "quarkus-pact")
    expect(sponsor).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("does not make fetch calls if the project is undefined", async () => {
    const sponsor = await findSponsor("someorg", undefined)
    expect(sponsor).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  fit("returns a list of company sponsors, given an org and project", async () => {
    setMinimumContributionCount(1)
    const sponsor = await findSponsor("someorg", "someproject")
    expect(fetch).toHaveBeenCalled()
    expect(sponsor).toContain("Red Hat")
  })

  it("orders company sponsors by contribution level", async () => {
    setMinimumContributionCount(1)
    setMinimumContributorCount(1)
    setMinimumContributionPercent(1)
    const sponsor = await findSponsor("someorg", "someproject")
    expect(fetch).toHaveBeenCalled()
    expect(sponsor).toStrictEqual(["Rabbit", "Red Hat", "Tortoise"])
  })

  it("filters out companies which do not have enough contributors", async () => {
    setMinimumContributionCount(10)
    const sponsor = await findSponsor("someorg", "someproject")
    expect(fetch).toHaveBeenCalled()
    expect(sponsor).toBeUndefined()
  })

  // Convenience tests for the logic which takes an array of contributor counts and turns it into a list of sponsors
  describe("when the contributor counts have already been collated", () => {

    beforeAll(() => {
      setMinimumContributionCount(5)
    })

    it("caches repo information", async () => {
      const sponsor = await findSponsorFromContributorList(pactContributors)
      expect(sponsor).not.toBeUndefined()
      const callCount = fetch.mock.calls.length
      const secondSponsor = await findSponsorFromContributorList(pactContributors)
      expect(secondSponsor).toStrictEqual(sponsor)
      // No extra calls should be made as everything should be cached
      expect(fetch.mock.calls.length).toBe(callCount)
    })

    it("sorts by number of commits", async () => {
      setMinimumContributorCount(0)
      setMinimumContributionPercent(10)

      const sponsors = await findSponsorFromContributorList(manyContributors)

      expect(sponsors.slice(0, 4)).toStrictEqual([
        companyWithASingleContributor,
        "Occasional Company",
        "Another Company",
        "Red Hat",
      ])
    })

    it("excludes companies which only have a single contributor", async () => {
      // Other tests may set this differently, so set it to the value this test expects
      setMinimumContributorCount(0)
      setMinimumContributionPercent(20)

      let sponsors = await findSponsorFromContributorList(manyContributors)
      expect(sponsors).toContain("Occasional Company")
      expect(sponsors).toContain(companyWithASingleContributor)

      // Now put in a higher threshold for the number of contributors
      setMinimumContributorCount(2)
      sponsors = await findSponsorFromContributorList(manyContributors)
      expect(sponsors).toContain("Occasional Company")
      expect(sponsors).not.toContain(companyWithASingleContributor)

    })

    describe("when the main user has linked to a github company account", () => {
      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      it("returns a company name", async () => {
        const sponsor = await findSponsorFromContributorList(pactContributors)
        expect(sponsor).toStrictEqual(["Red Hat"])
      })

      it("caches company information", async () => {
        const sponsor = await findSponsorFromContributorList(pactContributors)
        expect(sponsor).not.toBeUndefined()
        const callCount = fetch.mock.calls.length
        const secondSponsor = await findSponsorFromContributorList(anotherContributors)
        expect(secondSponsor).toStrictEqual(sponsor)
        // No extra fetch calls, since we passed in the contributor list and the company is cached
        expect(fetch.mock.calls.length).toBe(callCount)
      })
    })


    describe("when the main user is a bot", () => {

      const contributors = [
        {
          login: "dependabot[bot]",
          company: "Irrelevant",
          contributions: 27,
        },
      ]

      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })

    describe("when the main user is the actions user", () => {
      // The Actions User https://api.github.com/users/actions-user is not flagged as a bot, but we want to exclude it

      const contributors = [
        {
          login: "actions-user",
          name: "Actions User",
          company: "GitHub Actions",
          contributions: 27,
        },
      ]

      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })

    describe("when the main user is the quarkiverse bot", () => {
      const contributors =
        [
          {
            login: "quarkiversebot",
            name: "Unflagged bot",
            company: "Quarkiverse Hub",
            contributions: 27,
          },
        ]

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })
  })
  describe("company name normalization", () => {
    beforeEach(() => {
      clearCaches()
    })

    it("handles the simple case", async () => {
      const name = "Atlantic Octopus Federation"
      const sponsor = await normalizeCompanyName(name)
      expect(sponsor).toBe(name)
    })

    it("gracefully handles undefined", async () => {
      const sponsor = await normalizeCompanyName(undefined)
      expect(sponsor).toBeUndefined()
    })

    it("normalises a company name with Inc at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat, Inc")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with Inc. at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat, Inc.")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a 'by' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("JBoss by Red Hat by IBM")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with an '@' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat @kiegroup")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a parenthetical structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Linkare TI (@linkareti)")
      expect(sponsor).toBe("Linkare TI")
    })

    it("normalises a company name with a hyphenated '@' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat - @hibernate")
      expect(sponsor).toBe("Red Hat")
    })
  })
})