const courseModules = {
  cloud: () => import('./cloud.json'),
  blockchain: () => import('./blockchain.json'),
  iot: () => import('./iot.json'),
  entrepreneurship: () => import('./entrepreneurship.json'),
};

export const COURSES = [
  {
    id: 'cloud',
    name: 'Cloud Computing',
    desc: 'Distributed Systems, Virtualization & Azure/GCP',
    icon: 'cloud',
    color: '#38bdf8',
    weeks: 12,
    questions: 120,
  },
  {
    id: 'blockchain',
    name: 'Blockchain & Applications',
    desc: 'Cryptography, Consensus & Cryptocurrency',
    icon: 'hub',
    color: '#00d4ff',
    weeks: 11,
    questions: 109,
  },
  {
    id: 'iot',
    name: 'Introduction to IoT',
    desc: 'Sensors, Actuators, Wireless Networks & IoT Protocols',
    icon: 'satellite_alt',
    color: '#10b981',
    weeks: 12,
    questions: 180,
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    desc: 'Ideation, Prototyping, Disruption & Business Strategies',
    icon: 'rocket_launch',
    color: '#f59e0b',
    weeks: 12,
    questions: 120,
  },
];

export async function loadCourse(course) {
  const loader = courseModules[course];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}
