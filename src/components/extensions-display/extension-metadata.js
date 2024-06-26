import * as React from "react"

import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "gatsby-link"

const MetadataBlock = styled.section`
  width: calc((50%) - var(--a-modest-space));
  color: var(--sec-text-color);
  text-align: left;
  overflow-wrap: break-word;
  font-size: var(--font-size-16);
  padding-left: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
  padding-top: var(--a-modest-space);
  border-bottom: 1px solid var(--card-outline);

  :visited {
    color: var(--link-color);
  }
`

const MetadataTitle = styled.div`
  margin-bottom: var(--a-small-space);
`

const MetadataValue = styled.div`
  font-weight: var(--font-weight-bold);
`

const PaddedIcon = styled(props => <FontAwesomeIcon {...props} />)`
  margin-left: 0;
  margin-right: 5px;
`

const ExtensionMetadata = ({
                             data: { name, plural, fieldName, metadata, transformer, text, url, linkGenerator, icon },
                           }) => {
  const field = fieldName ? fieldName : name.toLowerCase()

  const content = text ? text : metadata?.[field]
  if (content) {
    const transform = element => (transformer ? transformer(element) : element)

    if (Array.isArray(content)) {
      const prettyPrinted = content
        .map(element => {
          return { pretty: transform(element), raw: element }
        })
        .filter(el => el.pretty != null)
      // Do an extra check, in case transforming the array removed its content
      if (prettyPrinted.length > 0) {
        const title = plural && content.length > 1 ? plural : name
        return (
          <MetadataBlock>
            <MetadataTitle>{title}</MetadataTitle>
            {prettyPrinted.map(
              (element, i) => {
                if (element) {
                  const displayed = linkGenerator ?
                    <Link
                      to={linkGenerator(element.raw).replaceAll(" ", "+").toLowerCase()}>{element.pretty}</Link> : element.raw.url ?
                      <a href={element.raw.url}>{element.pretty}</a> : element.pretty
                  return <MetadataValue key={i}>{displayed}</MetadataValue>
                }
              }
            )}
          </MetadataBlock>
        )
      }
    } else {
      const prettyPrinted = transform(content)
      const displayed = linkGenerator ?
        <Link to={linkGenerator(content).replaceAll(" ", "+")}>{prettyPrinted}</Link> : url ?
          <a href={url}>{prettyPrinted}</a> : prettyPrinted

      return (
        <MetadataBlock>
          <MetadataTitle>{name}</MetadataTitle>
          <MetadataValue>
            {/*Anything added here also needs to be added to the FA library in layout.js */}
            {icon && <PaddedIcon icon={["fab", icon]} />}
            {displayed}
          </MetadataValue>
        </MetadataBlock>
      )
    }
  }
}

export default ExtensionMetadata
