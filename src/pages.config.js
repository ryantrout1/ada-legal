/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminCases from './pages/AdminCases';
import AdminLawyers from './pages/AdminLawyers';
import AdminReview from './pages/AdminReview';
import CaseDetail from './pages/CaseDetail';
import GuideAdaProtections from './pages/GuideAdaProtections';
import GuideEffectiveCommunication from './pages/GuideEffectiveCommunication';
import GuideFilingComplaint from './pages/GuideFilingComplaint';
import GuideIntroToAda from './pages/GuideIntroToAda';
import GuideMobilityDevices from './pages/GuideMobilityDevices';
import GuideParking from './pages/GuideParking';
import GuideReasonableModifications from './pages/GuideReasonableModifications';
import GuideServiceAnimals from './pages/GuideServiceAnimals';
import Home from './pages/Home';
import Intake from './pages/Intake';
import LawyerCaseDetail from './pages/LawyerCaseDetail';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerLanding from './pages/LawyerLanding';
import LawyerProfile from './pages/LawyerProfile';
import LawyerRegister from './pages/LawyerRegister';
import Marketplace from './pages/Marketplace';
import MyCases from './pages/MyCases';
import StandardsGuide from './pages/StandardsGuide';
import GuideSmallBusiness from './pages/GuideSmallBusiness';
import GuideParkingRequirements from './pages/GuideParkingRequirements';
import GuideBarrierRemoval from './pages/GuideBarrierRemoval';
import GuideNewConstruction from './pages/GuideNewConstruction';
import GuideRestrooms from './pages/GuideRestrooms';
import GuideEntrances from './pages/GuideEntrances';
import GuideRamps from './pages/GuideRamps';
import GuideSignage from './pages/GuideSignage';
import GuideTaxIncentives from './pages/GuideTaxIncentives';
import GuideHotelsLodging from './pages/GuideHotelsLodging';
import GuideRestaurantsRetail from './pages/GuideRestaurantsRetail';
import GuideMedicalFacilities from './pages/GuideMedicalFacilities';
import GuideWebRule from './pages/GuideWebRule';
import GuideWcagExplained from './pages/GuideWcagExplained';
import GuideWebFirstSteps from './pages/GuideWebFirstSteps';
import GuideWebTesting from './pages/GuideWebTesting';
import GuideAccessibleDocuments from './pages/GuideAccessibleDocuments';
import GuideSocialMedia from './pages/GuideSocialMedia';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminAnalytics": AdminAnalytics,
    "AdminCases": AdminCases,
    "AdminLawyers": AdminLawyers,
    "AdminReview": AdminReview,
    "CaseDetail": CaseDetail,
    "GuideAdaProtections": GuideAdaProtections,
    "GuideEffectiveCommunication": GuideEffectiveCommunication,
    "GuideFilingComplaint": GuideFilingComplaint,
    "GuideIntroToAda": GuideIntroToAda,
    "GuideMobilityDevices": GuideMobilityDevices,
    "GuideParking": GuideParking,
    "GuideReasonableModifications": GuideReasonableModifications,
    "GuideServiceAnimals": GuideServiceAnimals,
    "Home": Home,
    "Intake": Intake,
    "LawyerCaseDetail": LawyerCaseDetail,
    "LawyerDashboard": LawyerDashboard,
    "LawyerLanding": LawyerLanding,
    "LawyerProfile": LawyerProfile,
    "LawyerRegister": LawyerRegister,
    "Marketplace": Marketplace,
    "MyCases": MyCases,
    "StandardsGuide": StandardsGuide,
    "GuideSmallBusiness": GuideSmallBusiness,
    "GuideParkingRequirements": GuideParkingRequirements,
    "GuideBarrierRemoval": GuideBarrierRemoval,
    "GuideNewConstruction": GuideNewConstruction,
    "GuideRestrooms": GuideRestrooms,
    "GuideEntrances": GuideEntrances,
    "GuideRamps": GuideRamps,
    "GuideSignage": GuideSignage,
    "GuideTaxIncentives": GuideTaxIncentives,
    "GuideHotelsLodging": GuideHotelsLodging,
    "GuideRestaurantsRetail": GuideRestaurantsRetail,
    "GuideMedicalFacilities": GuideMedicalFacilities,
    "GuideWebRule": GuideWebRule,
    "GuideWcagExplained": GuideWcagExplained,
    "GuideWebFirstSteps": GuideWebFirstSteps,
    "GuideWebTesting": GuideWebTesting,
    "GuideAccessibleDocuments": GuideAccessibleDocuments,
    "GuideSocialMedia": GuideSocialMedia,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};