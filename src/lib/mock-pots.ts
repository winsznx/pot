export type MockPot = {
  id: string;
  title: string;
  story: string;
  creator: string;
  creatorName: string;
  raised: number;
  target: number;
  contributors: number;
  deadline: number;
  refundIfMissed: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

export const MOCK_POTS: MockPot[] = [
  {
    id: "0001",
    title: "Adaeze's tuition for final semester",
    story:
      "My sister is one semester away from her engineering degree. We need $480 to cover registration before the May 14 cut-off. Anything you can spare keeps her enrolled.",
    creator: "0x9F3aD17B0c8e2C7d44AaA4ee2e1F8Fb33C9a7811",
    creatorName: "ife.eth",
    raised: 312,
    target: 480,
    contributors: 27,
    deadline: Date.now() + 6 * DAY,
    refundIfMissed: true,
  },
  {
    id: "0002",
    title: "Replacement laptop for the design coop",
    story:
      "Our shared M1 fell off a desk during last week's review. We're 7 designers sharing one machine; we need it back online to keep client work moving.",
    creator: "0x4Bd8Fa1dA2eCf119F77E83a31f8e5Ee6d7Ee0b22",
    creatorName: "coop.lagos",
    raised: 845,
    target: 1100,
    contributors: 41,
    deadline: Date.now() + 11 * DAY,
    refundIfMissed: true,
  },
  {
    id: "0003",
    title: "Weekend medical fund — Tunde",
    story:
      "Friend of the community needs an emergency dental procedure on Monday. Doctor quoted $220. Pulling stables in tonight so we can wire the clinic by Sunday evening.",
    creator: "0x76FbCe22aA3aE2Bb9d6E6c4519E14eF4B2a30077",
    creatorName: "tunde.cel",
    raised: 220,
    target: 220,
    contributors: 18,
    deadline: Date.now() + 1 * DAY,
    refundIfMissed: false,
  },
  {
    id: "0004",
    title: "Print run — Issue 03 of the zine",
    story:
      "200 copies, risograph, distributed free to readers across Accra and Lagos. We've covered design and writing, just need the print bill.",
    creator: "0xA12cE5b53d2F4123b88AAC5F1eDc41E2c0B9bC11",
    creatorName: "zine.print",
    raised: 132,
    target: 600,
    contributors: 9,
    deadline: Date.now() + 18 * DAY,
    refundIfMissed: true,
  },
  {
    id: "0005",
    title: "Burial contribution — Mama Grace",
    story:
      "Aunt of our neighborhood passed last week. Family is collecting for the service this Saturday. No deadline pressure but every contribution helps.",
    creator: "0x2c91A84d9EeF1A2BfC332dE5b88fB7a1cE6eBcD3",
    creatorName: "estate.0xab",
    raised: 1840,
    target: 0,
    contributors: 96,
    deadline: 0,
    refundIfMissed: false,
  },
  {
    id: "0006",
    title: "Football kit for the under-15 team",
    story:
      "12 kids on the team. Each kit is around $35. Targeting full set + boots before season opener May 22.",
    creator: "0xF89b3eA2dEc7F119F77cE3a31f8e5Ee6d7Ee0b88",
    creatorName: "coach.k",
    raised: 90,
    target: 600,
    contributors: 6,
    deadline: Date.now() + 14 * DAY,
    refundIfMissed: true,
  },
];

export function findPot(id: string): MockPot | undefined {
  return MOCK_POTS.find((p) => p.id === id);
}
