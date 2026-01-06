import { DistortionStage, DistortionControl } from '@mix-toolkit/canvas-editor/src/2d'

export const CanvasEditorPage = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <DistortionStage
          currentPeiYi={{
            id: '1',
            type: 0,
            mode: 0,
            maskList: [],
            templateId: 'template-1',
            originUrl:
              'https://lt-eps-test.oss-cn-shenzhen.aliyuncs.com/eps-test/Upload/2022-09-01/6lq75yof8n52.jpg?response-cache-control=public%2C%20max-age%3D3300&security-token=CAISlAV1q6Ft5B2yfSjIr5naDuPxqagVz7GJU2D8o3Y6dPtDipTppTz2IHhMfnJqBOwav%2Fw3mGlZ7P4dlqJpTJtIXkHfdsp36MyuCIBcstGT1fau5Jko1bdOcgr6Umxutq2%2FSuH9S8yns53PD3nPii50x5bjaDymRCbLGJaViJlhHDR9PGy%2FdiEUK9pKAQFgpcQGVwPWLu3%2FHRP2pWDSAUF0kwF46xx48r%2Ft7cCAzRDcgVbm9OIPvIX2JLGva6sQO4xkAfi4wMt8dKfKzBJZ5BdL8qgU%2F6tf4mXos826CVtc6Am4PvDP89ppEAZ2aak8FMw4q%2BPnx9J1psvZlYn81yhAJ%2FpUVCK9IYe725n8Bf%2BOPNQ0fqqZR3PWyYK3K4XSuQEpam4nPQxFetwuSAx3Egd%2BcizGDaWl9VvWXAq5UKmC1p0%2F3pV0yVqKmN2RPAqrQq6F6S8CJoReH0QzLEwy3Hf9V7ICbw1Uekl7Oq6RSox%2Fd3Iurrjz7yTYUTd862xTo%2FzmbunKh7gbbozzJKokt7AQf5NbqWAnYk3qQra18CcueXdiXKxd3duxW%2B6246TXx%2F6IM6yUSKIDphBXaSuUsyeWVTQST1L47cZxbkGDqYaDjv7I79ZtCBBr%2Bt1EESP9KIcy8QU7u%2Fvvt0%2FLq7S%2BD0rHpDRopoPqmKBU8lZhc%2FuehOufgyXTpnT4Y9NiwJ%2BNAzcyHUjmIyQlmaHI3i0d6wsalnnxIVME90%2FU0Xr1cdUAl%2BCG3W8BW%2FgOwr%2BGFWz8rj08WcIaYQ%2Bo9iLLFwonc4FfvWkBrpWPx3U7S10MprVDbKdy%2B%2B%2BT6Wr011C7Hl5lZatsw7U6UWemI%2FYB9NUFnEdOh2p05c00fV0xf0BADOhNX844ANDf3%2F8agAFuChnco6NiY6pKdCX0DMVzdgp622ssDHIXKL4YSqRgkXRdQcD%2F0u%2FZwKN%2B%2FDjLLi0JkMcOdy0N9xr0eYJ%2FbKFaWeL5Aj5hnI%2FUayeXqw38RXDXBnyplRdnoAbsrQvJWVEp%2By8bRYJYLBD1rd3xCc3KNcXOodly8mtZtGdEPe3s8CAA&OSSAccessKeyId=STS.NZoEYEDw4xsbQFMGvoxtoeQBG&Expires=1767693110&Signature=FgXt2hNTSYE7g%2BBfpURjsaPaHU8%3D',
            width: 400,
            height: 600,
            canvasRatio: 1,
            distortionList: [],
            vertices: [
              {
                id: '',
                sixteenPoints: [
                  436, 491, 436, 636, 436, 782, 436, 927, 582, 491, 582, 636, 582, 782, 582, 927, 727, 491, 727, 636,
                  727, 782, 727, 927, 873, 491, 873, 636, 873, 782, 873, 927
                ],
                relativePatternId: 'pattern-1'
              }
            ]
          }}
          onPeiYiUpdate={updatedPeiYi => {
            console.log('Updated PeiYi:', updatedPeiYi)
          }}
        />
      </div>
      <div style={{ width: '300px', borderLeft: '1px solid #ddd' }}>
        <DistortionControl />
      </div>
    </div>
  )
}
