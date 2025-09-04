import { Project, ProjectFile } from "./types";

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Vinayak_Test",
    description: "Test project for demonstration purposes",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-08-09"),
    files: [
      {
        id: "file1",
        name: "Statement_of_Claim_(1-54).pdf",
        type: "pdf",
        size: 3.28 * 1024 * 1024, // 3.28 MB
        uploadedAt: new Date("2024-08-09"),
        updatedAt: new Date("2024-08-09"),
        documentType: "PDF",
        pageCount: 345,
        url: "#"
      },
      {
        id: "file2",
        name: "Contract_Agreement.docx",
        type: "docx",
        size: 1.2 * 1024 * 1024, // 1.2 MB
        uploadedAt: new Date("2024-08-08"),
        updatedAt: new Date("2024-08-08"),
        documentType: "Word (.docx)",
        url: "#"
      },
      {
        id: "file3",
        name: "Financial_Report.xlsx",
        type: "xlsx",
        size: 856 * 1024, // 856 KB
        uploadedAt: new Date("2024-08-07"),
        updatedAt: new Date("2024-08-07"),
        documentType: "Excel",
        url: "#"
      }
    ],
    totalSize: 5.336 * 1024 * 1024, // 5.336 MB
    fileCount: 3,
    status: "active"
  },
  {
    id: "2",
    name: "Legal_Documents_2024",
    description: "Collection of legal documents and contracts",
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-08-05"),
    files: [
      {
        id: "file4",
        name: "Legal_Brief.pdf",
        type: "pdf",
        size: 2.1 * 1024 * 1024, // 2.1 MB
        uploadedAt: new Date("2024-08-05"),
        updatedAt: new Date("2024-08-05"),
        documentType: "PDF",
        pageCount: 156,
        url: "#"
      },
      {
        id: "file5",
        name: "Court_Order.pdf",
        type: "pdf",
        size: 890 * 1024, // 890 KB
        uploadedAt: new Date("2024-08-04"),
        updatedAt: new Date("2024-08-04"),
        documentType: "PDF",
        pageCount: 23,
        url: "#"
      }
    ],
    totalSize: 2.99 * 1024 * 1024, // 2.99 MB
    fileCount: 2,
    status: "active"
  },
  {
    id: "3",
    name: "Business_Proposal",
    description: "Business proposal and related documents",
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-08-01"),
    files: [
      {
        id: "file6",
        name: "Proposal_Presentation.pptx",
        type: "pptx",
        size: 4.5 * 1024 * 1024, // 4.5 MB
        uploadedAt: new Date("2024-08-01"),
        updatedAt: new Date("2024-08-01"),
        documentType: "PowerPoint",
        url: "#"
      },
      {
        id: "file7",
        name: "Budget_Spreadsheet.xlsx",
        type: "xlsx",
        size: 1.8 * 1024 * 1024, // 1.8 MB
        uploadedAt: new Date("2024-07-30"),
        updatedAt: new Date("2024-07-30"),
        documentType: "Excel",
        url: "#"
      },
      {
        id: "file8",
        name: "Supporting_Images.zip",
        type: "zip",
        size: 12.3 * 1024 * 1024, // 12.3 MB
        uploadedAt: new Date("2024-07-29"),
        updatedAt: new Date("2024-07-29"),
        documentType: "Zip",
        url: "#"
      }
    ],
    totalSize: 18.6 * 1024 * 1024, // 18.6 MB
    fileCount: 3,
    status: "processing"
  }
];
