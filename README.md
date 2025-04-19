# Document Management System (DMS) - oneDMS

## Overview
The **Document Management System (DMS)**, branded as **oneDMS**, is a web-based application designed to streamline the storage, organization, and management of documents for businesses. It provides a secure, scalable, and user-friendly platform with features like role-based access control (RBAC), document versioning, compliance management, and efficient search capabilities. This project was developed as part of the Innovation Practices at **PSG College of Technology**.

## Features
- **User Management**: Role-based authentication, account creation, modification, and deactivation with user data (name, email, role, contact, permissions).
- **Document Management**: Upload, store, and organize documents in folders or categories, supporting multiple file formats (PDF, DOCX, XLSX). Includes automatic versioning and document tagging.
- **Access Control**: Define roles (Admin, Editor, Viewer) and assign permissions at folder or document levels to prevent unauthorized access.
- **Compliance Management**: Configurable data retention policies and compliance report generation for audits.
- **Search and Retrieval**: Optimized search by document name, tags, or metadata, with sorting by date, type, or size, leveraging indexing and caching for performance.
- **Audit Trails**: Log user activities (uploads, edits, deletions) and generate access reports.
- **Non-Functional Requirements**:
  - **Performance**: Efficient handling of large document volumes with minimal delays.
  - **Scalability**: Supports growing numbers of documents and users.
  - **Security**: Strong encryption for data storage/transmission and regular security updates.
  - **Availability**: 99.9% uptime during business hours.
  - **Usability**: Intuitive interface requiring minimal training.

## System Actors
- **Admin**: Manages users, settings, and system configurations.
- **Editor**: Uploads, edits, and organizes documents.
- **Viewer**: Accesses documents with read-only permissions.

## Pages
- **Home Page**: Welcomes users with an overview of oneDMS features, including role-based access, smart filters, favorites, and collaboration tools. Links to Login/Signup pages.
- **Login Page**: Allows registered users to log in with username and password, with a link to the Forgot Password page.
- **Signup Page**: Enables new users to create accounts by providing name, email, and password.
- **Forgot Password Page**: Assists users in resetting passwords via registered email or username.
- **DMS Application Page**: Main hub for document management, featuring audit logs, admin panel, smart filters, favorites, and collaboration tools.

## Clone the repository:
   ```bash
   git clone https://github.com/GOWTHAM-97-GRADE/DocumentManagementSystem.git
   ```
## Usage
- Access the application via the browser at `http://localhost:<port>`.
- Sign up for a new account or log in with existing credentials.
- Use the DMS Application Page to upload, manage, and search documents.
- Admins can access the admin panel to manage users and settings.

## Dependencies
- Integration with existing authentication systems (e.g., OAuth, LDAP).
- Refer to the `System Architecture Document` and `Project Charter` for detailed dependency information.

## Risks and Assumptions
- **Risks**: Potential delays due to budget constraints.
- **Assumptions**: Users have basic knowledge of web applications and file management systems.

## Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
For inquiries, please contact the project team at **PSG College of Technology** or open an issue on this repository.

---

**A Smarter Way to Organize, Access, and Manage Your Documents**
