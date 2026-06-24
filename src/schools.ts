export type SchoolDepartment = {
  name: string;
  slug: string;
};

export type SchoolFaculty = {
  name: string;
  slug: string;
  departments: SchoolDepartment[];
};

export type School = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl: string;
  faculties: SchoolFaculty[];
};

export const schools: School[] = [
  {
    id: 'unilorin',
    name: 'University of Ilorin',
    slug: 'unilorin',
    isActive: true,
    logoUrl: '/schools/unilorin-logo.png',
    faculties: [
      {
        name: 'Agriculture',
        slug: 'agriculture',
        departments: [
          { name: 'Agricultural Economics & Farm Management', slug: 'agric-economics' },
          { name: 'Agricultural Extension & Rural Development', slug: 'agric-extension' },
          { name: 'Agronomy', slug: 'agronomy' },
          { name: 'Animal Production', slug: 'animal-production' },
          { name: 'Crop Protection', slug: 'crop-protection' },
          { name: 'Home Economics & Food Science', slug: 'home-economics' },
          { name: 'Aquaculture & Fisheries', slug: 'aquaculture' },
          { name: 'Forest Resources Management', slug: 'forestry' },
        ],
      },
      {
        name: 'Arts',
        slug: 'arts',
        departments: [
          { name: 'Arabic', slug: 'arabic' },
          { name: 'Christian Studies', slug: 'christian-studies' },
          { name: 'Comparative Religious Studies', slug: 'crs' },
          { name: 'English', slug: 'english' },
          { name: 'French', slug: 'french' },
          { name: 'History & International Studies', slug: 'history' },
          { name: 'Islamic Studies', slug: 'islamic-studies' },
          { name: 'Linguistics', slug: 'linguistics' },
          { name: 'Performing Arts', slug: 'performing-arts' },
          { name: 'Yoruba', slug: 'yoruba' },
        ],
      },
      {
        name: 'Basic Medical Sciences',
        slug: 'basic-medical-sciences',
        departments: [
          { name: 'Anatomy', slug: 'anatomy' },
          { name: 'Physiology', slug: 'physiology' },
          { name: 'Medical Biochemistry', slug: 'medical-biochemistry' },
        ],
      },
      {
        name: 'Clinical Sciences',
        slug: 'clinical-sciences',
        departments: [
          { name: 'Medicine & Surgery', slug: 'medicine' },
          { name: 'Radiography', slug: 'radiography' },
        ],
      },
      {
        name: 'Communication & Information Sciences',
        slug: 'cis',
        departments: [
          { name: 'Computer Science', slug: 'computer-science' },
          { name: 'Information & Communication Science', slug: 'ics' },
          { name: 'Library & Information Science', slug: 'lis' },
          { name: 'Mass Communication', slug: 'mass-communication' },
          { name: 'Telecommunication Science', slug: 'telecom' },
        ],
      },
      {
        name: 'Education',
        slug: 'education',
        departments: [
          { name: 'Adult & Primary Education', slug: 'adult-education' },
          { name: 'Arts Education', slug: 'arts-education' },
          { name: 'Counsellor Education', slug: 'counsellor-education' },
          { name: 'Educational Management', slug: 'educational-management' },
          { name: 'Educational Technology', slug: 'educational-technology' },
          { name: 'Health Promotion & Environmental Health Education', slug: 'health-education' },
          { name: 'Human Kinetics Education', slug: 'human-kinetics' },
          { name: 'Science Education', slug: 'science-education' },
          { name: 'Social Sciences Education', slug: 'social-sciences-education' },
          { name: 'Special Education', slug: 'special-education' },
        ],
      },
      {
        name: 'Engineering & Technology',
        slug: 'engineering',
        departments: [
          { name: 'Agricultural & Biosystems Engineering', slug: 'agric-engineering' },
          { name: 'Biomedical Engineering', slug: 'biomedical-engineering' },
          { name: 'Chemical Engineering', slug: 'chemical-engineering' },
          { name: 'Civil Engineering', slug: 'civil-engineering' },
          { name: 'Computer Engineering', slug: 'computer-engineering' },
          { name: 'Electrical & Electronics Engineering', slug: 'electrical-engineering' },
          { name: 'Food Engineering', slug: 'food-engineering' },
          { name: 'Materials & Metallurgical Engineering', slug: 'materials-engineering' },
          { name: 'Mechanical Engineering', slug: 'mechanical-engineering' },
          { name: 'Water Resources & Environmental Engineering', slug: 'water-resources' },
        ],
      },
      {
        name: 'Environmental Sciences',
        slug: 'environmental-sciences',
        departments: [
          { name: 'Architecture', slug: 'architecture' },
          { name: 'Estate Management', slug: 'estate-management' },
          { name: 'Quantity Surveying', slug: 'quantity-surveying' },
          { name: 'Surveying & Geoinformatics', slug: 'surveying' },
          { name: 'Urban & Regional Planning', slug: 'urban-planning' },
        ],
      },
      {
        name: 'Law',
        slug: 'law',
        departments: [
          { name: 'Common Law', slug: 'common-law' },
          { name: 'Islamic Law', slug: 'islamic-law' },
        ],
      },
      {
        name: 'Life Sciences',
        slug: 'life-sciences',
        departments: [
          { name: 'Biochemistry', slug: 'biochemistry' },
          { name: 'Microbiology', slug: 'microbiology' },
          { name: 'Plant Biology', slug: 'plant-biology' },
          { name: 'Zoology', slug: 'zoology' },
          { name: 'Optometry & Vision Science', slug: 'optometry' },
        ],
      },
      {
        name: 'Management Sciences',
        slug: 'management-sciences',
        departments: [
          { name: 'Accounting', slug: 'accounting' },
          { name: 'Finance', slug: 'finance' },
          { name: 'Industrial Relations & Personnel Management', slug: 'irpm' },
          { name: 'Business Administration', slug: 'business-admin' },
          { name: 'Marketing', slug: 'marketing' },
          { name: 'Public Administration', slug: 'public-admin' },
        ],
      },
      {
        name: 'Pharmaceutical Sciences',
        slug: 'pharmacy',
        departments: [
          { name: 'Clinical Pharmacy & Pharmacy Practice', slug: 'clinical-pharmacy' },
          { name: 'Pharmaceutical & Medicinal Chemistry', slug: 'pharm-chemistry' },
          { name: 'Pharmaceutics & Industrial Pharmacy', slug: 'pharmaceutics' },
          { name: 'Pharmacognosy & Drug Development', slug: 'pharmacognosy' },
          { name: 'Pharmacology & Toxicology', slug: 'pharmacology' },
        ],
      },
      {
        name: 'Physical Sciences',
        slug: 'physical-sciences',
        departments: [
          { name: 'Chemistry', slug: 'chemistry' },
          { name: 'Geology & Mineral Science', slug: 'geology' },
          { name: 'Geophysics', slug: 'geophysics' },
          { name: 'Industrial Chemistry', slug: 'industrial-chemistry' },
          { name: 'Mathematics', slug: 'mathematics' },
          { name: 'Physics', slug: 'physics' },
          { name: 'Statistics', slug: 'statistics' },
        ],
      },
      {
        name: 'Social Sciences',
        slug: 'social-sciences',
        departments: [
          { name: 'Economics', slug: 'economics' },
          { name: 'Geography & Environmental Management', slug: 'geography' },
          { name: 'Political Science', slug: 'political-science' },
          { name: 'Psychology', slug: 'psychology' },
          { name: 'Sociology', slug: 'sociology' },
        ],
      },
      {
        name: 'Veterinary Medicine',
        slug: 'veterinary-medicine',
        departments: [
          { name: 'Veterinary Anatomy', slug: 'vet-anatomy' },
          { name: 'Veterinary Medicine', slug: 'vet-medicine' },
          { name: 'Veterinary Microbiology', slug: 'vet-microbiology' },
          { name: 'Veterinary Parasitology & Entomology', slug: 'vet-parasitology' },
          { name: 'Veterinary Pathology', slug: 'vet-pathology' },
          { name: 'Veterinary Physiology & Biochemistry', slug: 'vet-physiology' },
          { name: 'Veterinary Public Health & Preventive Medicine', slug: 'vet-public-health' },
          { name: 'Veterinary Surgery & Radiology', slug: 'vet-surgery' },
          { name: 'Veterinary Theriogenology & Production', slug: 'vet-theriogenology' },
        ],
      },
    ],
  },
];

export function getActiveSchool() {
  return schools.find((school) => school.isActive) ?? schools[0];
}
