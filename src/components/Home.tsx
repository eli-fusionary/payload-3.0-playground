import React from 'react'

import { Page } from 'payload-types'

const Home: React.FC<Page> = async ({ content_html }: Page) => {
  return <div dangerouslySetInnerHTML={{ __html: content_html as TrustedHTML }}></div>
}

export default Home
