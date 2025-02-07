import { Snippet } from "./Snippet";
import { FileIcon, FolderIcon, JSXIcon } from "./Icons";

export function Docs() {
  return (
    <div className="max-w-full rounded-tl-3xl bg-[#1f2937] py-8 text-white">
      <h2 className="mb-10 pl-5 text-3xl font-medium">PROJECT DESCRIPTION</h2>
      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">Project Name</h2>
        <p className="mt-4">FPT Medical Care System (FMCS) - Healthcare Management System for FPT University Medical Department</p>
        <p className="mt-2">Project code: FMCS</p>
      </section>

      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">Project Overview</h2>
        <p className="mt-4">
          FMCS is a comprehensive platform designed to manage healthcare activities at FPT University. The system provides features for managing medical records, treatment history tracking, appointment scheduling, medication management, and healthcare staff administration, aimed at improving healthcare quality for students, lecturers, and staff members.
        </p>
      </section>

      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">System Actors</h2>
        <ul className="mt-4 list-disc pl-6">
          <li className="mb-4">Admin: System administrator responsible for managing and maintaining system operations.</li>
          <li className="mb-4">Manager: Healthcare manager overseeing medical activities and personnel management.</li>
          <li className="mb-4">Staff: Medical staff directly responsible for medical examinations, medication dispensing, and healthcare services.</li>
          <li>User: System users (students, lecturers, and staff members).</li>
        </ul>
      </section>

      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">1. Medical Records Management</h2>
        <p className="mt-4">
          Medical records management includes detailed health information of students, lecturers, and staff, enabling medical personnel to track individual medical histories and treatments.
        </p>
        <h3 className="mt-4 text-xl">Key Information Management:</h3>
        <ul className="mt-4 list-disc pl-6">
          <li className="mb-3">Personal Information: Name, age, gender, student ID, emergency contacts, etc.</li>
          <li className="mb-3">Medical History: Information about past illnesses and current health conditions.</li>
          <li className="mb-3">Treatment History: List of medical examinations, diagnoses, and results.</li>
          <li className="mb-3">Prescriptions: Record of dispensed medications.</li>
          <li className="mb-3">Vaccination Records: Documentation of vaccines and immunization dates.</li>
          <li className="mb-3">Health Insurance Information: Details about insurance coverage and medical benefits.</li>
          <li>Regular Health Check Results: Summary of periodic health examinations and outcomes.</li>
        </ul>
      </section>

      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">2. System Roles and Functions</h2>
        <h3 className="mt-4 text-xl">Web Platform Roles</h3>
        
        <div className="mt-4">
          <h4 className="text-lg font-medium">Administrator</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Manage system user accounts</li>
            <li className="mb-2">Role assignment and activity monitoring</li>
            <li className="mb-2">Medical facility and service management</li>
            <li className="mb-2">Medication database and supplier management</li>
            <li className="mb-2">View comprehensive reports and healthcare activity statistics</li>
            <li>System security and stability maintenance</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-medium">Healthcare Manager</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Manage all user medical records</li>
            <li className="mb-2">Schedule medical staff work shifts</li>
            <li className="mb-2">Pharmacy inventory management</li>
            <li className="mb-2">Access treatment and medication usage reports</li>
            <li>Monitor medical staff performance</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-medium">Medical Staff</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Update patient examination and treatment information</li>
            <li className="mb-2">Schedule medical appointments for users</li>
            <li className="mb-2">Access medical history and treatment reports</li>
            <li className="mb-2">Dispense medications and update inventory</li>
            <li>Monitor and record patient health status post-treatment</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-medium">End User</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Login with university-provided email</li>
            <li className="mb-2">Manage personal health profile</li>
            <li className="mb-2">Schedule medical appointments</li>
            <li className="mb-2">Receive appointment and medication reminders</li>
            <li className="mb-2">Access prescribed medication information and usage guidelines</li>
            <li>Track medical history and diagnosis results</li>
          </ul>
        </div>

        <h3 className="mt-8 text-xl">Mobile Platform Roles</h3>
        <div className="mt-4">
          <h4 className="text-lg font-medium">Healthcare Manager</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">View and manage medical records and treatment history</li>
            <li className="mb-2">Monitor pharmacy inventory and medication reports</li>
            <li>Track staff schedules and appointment management</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-medium">Medical Staff</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Access and manage medical records and treatment history</li>
            <li className="mb-2">Update medical information and manage user appointments</li>
            <li className="mb-2">Record post-treatment health status</li>
            <li>Dispense medication and monitor inventory levels</li>
          </ul>
        </div>

        <div className="mt-4">
          <h4 className="text-lg font-medium">End User</h4>
          <ul className="mt-2 list-disc pl-6">
            <li className="mb-2">Login, manage personal profile, and access medical history</li>
            <li>Schedule appointments and receive medical notifications</li>
          </ul>
        </div>
      </section>

      <section className="mb-16 px-3 py-8 md:px-8">
        <h2 className="text-2xl font-medium">3. Technology Stack</h2>
        <ul className="mt-4 list-disc pl-6">
          <li className="mb-2">Frontend: ReactJS (Web), Flutter (Mobile)</li>
          <li className="mb-2">Backend: ASP.NET Core Web API</li>
          <li className="mb-2">Database: SQL Server</li>
          <li>Deployment: VPS</li>
        </ul>
      </section>
    </div>
  );
}
