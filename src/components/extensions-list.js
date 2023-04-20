import * as React from "react"
import { useState } from "react"
import Filters from "./filters/filters"
import ExtensionCard from "./extension-card"
import styled from "styled-components"

const FilterableList = styled.div`
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);
  margin-top: 85px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const Extensions = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
`

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;
`

const ExtensionCount = styled.div`
  margin-top: 1.25rem;
  margin-left: 3.25rem;
  width: 100%;
`

const ExtensionsList = ({ extensions, categories }) => {
  // Do some pre-filtering for content we will never want, like superseded extensions
  const allExtensions = extensions.filter(extension => !extension.isSuperseded)

  const [filteredExtensions, setExtensions] = useState(allExtensions)

  // TODO why is this guard necessary?
  if (allExtensions) {
    // Exclude unlisted extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = allExtensions.filter(
      extension => !extension.metadata.unlisted
    ).length

    // Sort alphabetically, in the absence of a better idea (for now)
    filteredExtensions.sort((a, b) =>
      a.sortableName > b.sortableName ? 1 : -1
    )

    const countMessage =
      extensionCount === filteredExtensions.length
        ? `Showing ${extensionCount} extensions.`
        : `Showing ${filteredExtensions.length} of ${extensionCount} extensions.`

    return (
      <FilterableList className="extensions-list">
        <Filters
          extensions={allExtensions}
          categories={categories}
          filterAction={setExtensions}
        />
        <RightColumn>
          {" "}
          <ExtensionCount>{countMessage}</ExtensionCount>
          <Extensions>
            {filteredExtensions.map(extension => {
              return (
                <li key={extension.id}>
                  <ExtensionCard extension={extension} />
                </li>
              )
            })}
          </Extensions>{" "}
        </RightColumn>
      </FilterableList>
    )
  } else {
    return (
      <div className="extensions-list" style={{ display: "flex" }}>
        No extensions found.
      </div>
    )
  }
}

export default ExtensionsList
