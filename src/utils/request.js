/* @flow */

import fetch from 'unfetch'

export default function request (
  url: string,
  options: any,
  contentType: any = 'application/json'
) {
  return fetch(
    url,
    Object.assign({}, options, {
      headers: {
        ...(contentType
          ? {
            Accept: contentType,
            'Content-Type': contentType
          }
          : {})
      }
    })
  )
    .then(response =>
      response.json().then(json => {
        return {
          data: json,
          ok: response.ok,
          status: response.status
        }
      })
    )
    .catch(err => err)
}
