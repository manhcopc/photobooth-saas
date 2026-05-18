export const defaultFrameConfig = {
  overlaySrc: '/frames/default-frame.svg',
  outputWidth: 1200,
  outputHeight: 1800,
  background: '#fff7fb',
  slots: [
    { x: 120, y: 170, width: 960, height: 430, radius: 42 },
    { x: 120, y: 660, width: 960, height: 430, radius: 42 },
    { x: 120, y: 1150, width: 960, height: 430, radius: 42 },
  ],
}

export const mockEvents = [
  {
    id: 'evt-demo',
    name: 'Pink Party Photobooth',
    slug: 'pink-party',
    date: '2026-06-01',
    description: 'Photobooth demo với khung hồng tím ngọt ngào cho khách mời.',
    frameUrl: defaultFrameConfig.overlaySrc,
    layoutConfig: defaultFrameConfig,
    createdAt: '2026-05-18T00:00:00.000Z',
  },
]
