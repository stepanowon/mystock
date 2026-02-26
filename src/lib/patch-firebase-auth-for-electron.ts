/**
 * Electron 환경에서 Firebase Auth의 도메인 검증을 우회하는 패치
 *
 * Firebase Auth SDK의 signInWithPopup은 내부적으로
 * identitytoolkit API의 getProjectConfig를 호출하여
 * authorizedDomains 목록을 가져온 뒤 window.location.hostname과 비교한다.
 * Electron 앱은 http://localhost:{random_port}에서 실행되는데,
 * Firebase가 이 오리진을 인식하지 못할 수 있다.
 *
 * 이 패치는 해당 API 응답을 가로채서 현재 호스트명을
 * authorizedDomains에 추가함으로써 검증을 통과시킨다.
 */

const isElectron =
  typeof window !== 'undefined' &&
  !!(window as unknown as { electronAPI?: { isElectron: boolean } }).electronAPI
    ?.isElectron

if (isElectron) {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (
    ...args: Parameters<typeof fetch>
  ): Promise<Response> => {
    const response = await originalFetch(...args)

    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof Request
          ? args[0].url
          : ''

    if (
      url.includes('identitytoolkit') &&
      url.includes('getProjectConfig')
    ) {
      const clone = response.clone()
      try {
        const data = await clone.json()
        const hostname = window.location.hostname
        if (
          Array.isArray(data.authorizedDomains) &&
          !data.authorizedDomains.includes(hostname)
        ) {
          data.authorizedDomains.push(hostname)
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          })
        }
      } catch {
        // JSON 파싱 실패 시 원본 응답 반환
      }
    }

    return response
  }
}
