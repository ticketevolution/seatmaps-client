interface Options {}

export default function request(url: string, options: Options, contentType = 'application/json') {
  return fetch(
    url,
    {
      ...options,
      headers: {
        ...(contentType
          ? {
            Accept: contentType,
            'Content-Type': contentType
          }
          : {})
      }
    }
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
