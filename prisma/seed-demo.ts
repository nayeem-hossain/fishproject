import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

async function main() {
  // ── Projects ────────────────────────────────────────────────────────────
  const p1 = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      projectName: "Padma River Fish Farm",
      ownerName: "Rahim Uddin",
      mobileNo: "01711-234567",
    },
  });

  const p2 = await prisma.project.upsert({
    where: { id: "demo-project-002" },
    update: {},
    create: {
      id: "demo-project-002",
      projectName: "Meghna Aqua Culture",
      ownerName: "Karim Hossain",
      mobileNo: "01811-345678",
    },
  });

  const p3 = await prisma.project.upsert({
    where: { id: "demo-project-003" },
    update: {},
    create: {
      id: "demo-project-003",
      projectName: "Sylhet Hill Trout Project",
      ownerName: "Fatema Begum",
      mobileNo: "01911-456789",
    },
  });

  // ── Documents ───────────────────────────────────────────────────────────
  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "demo-doc-001",
        projectId: p1.id,
        subProject: "Pond A",
        quantity: 5000,
        chequeNumber: "CHQ-001234",
        guarantorName: "Selim Mia",
        deedFileUrl: "https://placeholder.invalid/deed-001.pdf",
        guarantorChequeFileUrl: "https://placeholder.invalid/cheque-001.pdf",
        nidFileUrl: "https://placeholder.invalid/nid-001.pdf",
        tradeLicenseFileUrl: "https://placeholder.invalid/trade-001.pdf",
      },
      {
        id: "demo-doc-002",
        projectId: p1.id,
        subProject: "Pond B",
        quantity: 3000,
        chequeNumber: "CHQ-001235",
        guarantorName: "Jamal Khan",
        deedFileUrl: "https://placeholder.invalid/deed-002.pdf",
        guarantorChequeFileUrl: "https://placeholder.invalid/cheque-002.pdf",
        nidFileUrl: "https://placeholder.invalid/nid-002.pdf",
        tradeLicenseFileUrl: "https://placeholder.invalid/trade-002.pdf",
      },
      {
        id: "demo-doc-003",
        projectId: p2.id,
        subProject: "Tank 1",
        quantity: 8000,
        chequeNumber: "CHQ-002100",
        guarantorName: "Nasrin Akter",
        deedFileUrl: "https://placeholder.invalid/deed-003.pdf",
        guarantorChequeFileUrl: "https://placeholder.invalid/cheque-003.pdf",
        nidFileUrl: "https://placeholder.invalid/nid-003.pdf",
        tradeLicenseFileUrl: "https://placeholder.invalid/trade-003.pdf",
      },
      {
        id: "demo-doc-004",
        projectId: p3.id,
        subProject: "Stream 1",
        quantity: 2000,
        chequeNumber: "CHQ-003050",
        guarantorName: "Ratan Das",
        deedFileUrl: "https://placeholder.invalid/deed-004.pdf",
        guarantorChequeFileUrl: "https://placeholder.invalid/cheque-004.pdf",
        nidFileUrl: "https://placeholder.invalid/nid-004.pdf",
        tradeLicenseFileUrl: "https://placeholder.invalid/trade-004.pdf",
      },
    ],
  });

  // ── Inventory ───────────────────────────────────────────────────────────
  await prisma.inventory.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "demo-inv-001",
        projectId: p1.id,
        subProject: "Pond A",
        fishQuantity: 4800,
        sizeMon: new Decimal("0.250"),
        totalWeightKg: new Decimal("1200.000"),
      },
      {
        id: "demo-inv-002",
        projectId: p1.id,
        subProject: "Pond B",
        fishQuantity: 2900,
        sizeMon: new Decimal("0.180"),
        totalWeightKg: new Decimal("522.000"),
      },
      {
        id: "demo-inv-003",
        projectId: p2.id,
        subProject: "Tank 1",
        fishQuantity: 7600,
        sizeMon: new Decimal("0.320"),
        totalWeightKg: new Decimal("2432.000"),
      },
      {
        id: "demo-inv-004",
        projectId: p3.id,
        subProject: "Stream 1",
        fishQuantity: 1900,
        sizeMon: new Decimal("0.400"),
        totalWeightKg: new Decimal("760.000"),
      },
    ],
  });

  // ── Feed Logs ────────────────────────────────────────────────────────────
  const today = new Date("2026-05-22");
  const day = (offset: number) => new Date(today.getTime() - offset * 86400000);

  await prisma.feedLog.createMany({
    skipDuplicates: true,
    data: [
      // Project 1 – Pond A (last 5 days)
      { id: "demo-feed-001", projectId: p1.id, entryDate: day(4), openingBalance: new Decimal("500.000"), additionAmount: new Decimal("200.000"), dailyUse: new Decimal("45.000"), closingBalance: new Decimal("655.000") },
      { id: "demo-feed-002", projectId: p1.id, entryDate: day(3), openingBalance: new Decimal("655.000"), additionAmount: new Decimal("0.000"),   dailyUse: new Decimal("45.000"), closingBalance: new Decimal("610.000") },
      { id: "demo-feed-003", projectId: p1.id, entryDate: day(2), openingBalance: new Decimal("610.000"), additionAmount: new Decimal("300.000"), dailyUse: new Decimal("50.000"), closingBalance: new Decimal("860.000") },
      { id: "demo-feed-004", projectId: p1.id, entryDate: day(1), openingBalance: new Decimal("860.000"), additionAmount: new Decimal("0.000"),   dailyUse: new Decimal("50.000"), closingBalance: new Decimal("810.000") },
      { id: "demo-feed-005", projectId: p1.id, entryDate: day(0), openingBalance: new Decimal("810.000"), additionAmount: new Decimal("0.000"),   dailyUse: new Decimal("50.000"), closingBalance: new Decimal("760.000") },
      // Project 2 – Tank 1
      { id: "demo-feed-006", projectId: p2.id, entryDate: day(3), openingBalance: new Decimal("800.000"), additionAmount: new Decimal("400.000"), dailyUse: new Decimal("80.000"), closingBalance: new Decimal("1120.000") },
      { id: "demo-feed-007", projectId: p2.id, entryDate: day(2), openingBalance: new Decimal("1120.000"), additionAmount: new Decimal("0.000"),  dailyUse: new Decimal("80.000"), closingBalance: new Decimal("1040.000") },
      { id: "demo-feed-008", projectId: p2.id, entryDate: day(1), openingBalance: new Decimal("1040.000"), additionAmount: new Decimal("500.000"), dailyUse: new Decimal("80.000"), closingBalance: new Decimal("1460.000") },
      { id: "demo-feed-009", projectId: p2.id, entryDate: day(0), openingBalance: new Decimal("1460.000"), additionAmount: new Decimal("0.000"),  dailyUse: new Decimal("80.000"), closingBalance: new Decimal("1380.000") },
      // Project 3 – Stream 1
      { id: "demo-feed-010", projectId: p3.id, entryDate: day(2), openingBalance: new Decimal("300.000"), additionAmount: new Decimal("150.000"), dailyUse: new Decimal("30.000"), closingBalance: new Decimal("420.000") },
      { id: "demo-feed-011", projectId: p3.id, entryDate: day(1), openingBalance: new Decimal("420.000"), additionAmount: new Decimal("0.000"),   dailyUse: new Decimal("30.000"), closingBalance: new Decimal("390.000") },
      { id: "demo-feed-012", projectId: p3.id, entryDate: day(0), openingBalance: new Decimal("390.000"), additionAmount: new Decimal("100.000"), dailyUse: new Decimal("30.000"), closingBalance: new Decimal("460.000") },
    ],
  });

  console.log("Demo data seeded: 3 projects, 4 documents, 4 inventory records, 12 feed logs.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
