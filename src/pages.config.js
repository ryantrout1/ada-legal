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
import AdminEmails from './pages/AdminEmails';
import AdminFeedback from './pages/AdminFeedback';
import AdminLawyers from './pages/AdminLawyers';
import AdminReview from './pages/AdminReview';
import CaseDetail from './pages/CaseDetail';
import GuideAccessibleDocuments from './pages/GuideAccessibleDocuments';
import GuideAdaCoordinators from './pages/GuideAdaCoordinators';
import GuideAdaProtections from './pages/GuideAdaProtections';
import GuideBarrierRemoval from './pages/GuideBarrierRemoval';
import GuideCriminalJustice from './pages/GuideCriminalJustice';
import GuideDigitalBarriers from './pages/GuideDigitalBarriers';
import GuideEducation from './pages/GuideEducation';
import GuideEffectiveCommunication from './pages/GuideEffectiveCommunication';
import GuideEmergencyManagement from './pages/GuideEmergencyManagement';
import GuideEmployment from './pages/GuideEmployment';
import GuideEntrances from './pages/GuideEntrances';
import GuideFilingComplaint from './pages/GuideFilingComplaint';
import GuideHotelsLodging from './pages/GuideHotelsLodging';
import GuideHousing from './pages/GuideHousing';
import GuideIntroToAda from './pages/GuideIntroToAda';
import GuideLegalOptions from './pages/GuideLegalOptions';
import GuideMedicalFacilities from './pages/GuideMedicalFacilities';
import GuideMobilityDevices from './pages/GuideMobilityDevices';
import GuideNewConstruction from './pages/GuideNewConstruction';
import GuideParking from './pages/GuideParking';
import GuideParkingRequirements from './pages/GuideParkingRequirements';
import GuidePlaygrounds from './pages/GuidePlaygrounds';
import GuideProgramAccess from './pages/GuideProgramAccess';
import GuideRamps from './pages/GuideRamps';
import GuideReachRanges from './pages/GuideReachRanges';
import GuideReasonableModifications from './pages/GuideReasonableModifications';
import GuideRestaurantsRetail from './pages/GuideRestaurantsRetail';
import GuideRestrooms from './pages/GuideRestrooms';
import GuideServiceAnimals from './pages/GuideServiceAnimals';
import GuideSidewalks from './pages/GuideSidewalks';
import GuideSignage from './pages/GuideSignage';
import GuideSmallBusiness from './pages/GuideSmallBusiness';
import GuideSocialMedia from './pages/GuideSocialMedia';
import GuideSwimmingPools from './pages/GuideSwimmingPools';
import GuideTaxIncentives from './pages/GuideTaxIncentives';
import GuideTitleII from './pages/GuideTitleII';
import GuideTurningHandrails from './pages/GuideTurningHandrails';
import GuideVoting from './pages/GuideVoting';
import GuideWcagExplained from './pages/GuideWcagExplained';
import GuideWebFirstSteps from './pages/GuideWebFirstSteps';
import GuideWebRule from './pages/GuideWebRule';
import GuideWebTesting from './pages/GuideWebTesting';
import GuideWhatToExpect from './pages/GuideWhatToExpect';
import GuideWhyAttorney from './pages/GuideWhyAttorney';
import Home from './pages/Home';
import Intake from './pages/Intake';
import LawyerCaseDetail from './pages/LawyerCaseDetail';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerLanding from './pages/LawyerLanding';
import LawyerProfile from './pages/LawyerProfile';
import LawyerRegister from './pages/LawyerRegister';
import Marketplace from './pages/Marketplace';
import MyCases from './pages/MyCases';
import RightsPathway from './pages/RightsPathway';
import StandardsCh1 from './pages/StandardsCh1';
import StandardsCh10 from './pages/StandardsCh10';
import StandardsCh2 from './pages/StandardsCh2';
import StandardsCh3 from './pages/StandardsCh3';
import StandardsCh4 from './pages/StandardsCh4';
import StandardsCh5 from './pages/StandardsCh5';
import StandardsCh6 from './pages/StandardsCh6';
import StandardsCh7 from './pages/StandardsCh7';
import StandardsCh8 from './pages/StandardsCh8';
import StandardsCh9 from './pages/StandardsCh9';
import StandardsGuide from './pages/StandardsGuide';
import TitleIIPathway from './pages/TitleIIPathway';
import TitleIPathway from './pages/TitleIPathway';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminAnalytics": AdminAnalytics,
    "AdminCases": AdminCases,
    "AdminEmails": AdminEmails,
    "AdminFeedback": AdminFeedback,
    "AdminLawyers": AdminLawyers,
    "AdminReview": AdminReview,
    "CaseDetail": CaseDetail,
    "GuideAccessibleDocuments": GuideAccessibleDocuments,
    "GuideAdaCoordinators": GuideAdaCoordinators,
    "GuideAdaProtections": GuideAdaProtections,
    "GuideBarrierRemoval": GuideBarrierRemoval,
    "GuideCriminalJustice": GuideCriminalJustice,
    "GuideDigitalBarriers": GuideDigitalBarriers,
    "GuideEducation": GuideEducation,
    "GuideEffectiveCommunication": GuideEffectiveCommunication,
    "GuideEmergencyManagement": GuideEmergencyManagement,
    "GuideEmployment": GuideEmployment,
    "GuideEntrances": GuideEntrances,
    "GuideFilingComplaint": GuideFilingComplaint,
    "GuideHotelsLodging": GuideHotelsLodging,
    "GuideHousing": GuideHousing,
    "GuideIntroToAda": GuideIntroToAda,
    "GuideLegalOptions": GuideLegalOptions,
    "GuideMedicalFacilities": GuideMedicalFacilities,
    "GuideMobilityDevices": GuideMobilityDevices,
    "GuideNewConstruction": GuideNewConstruction,
    "GuideParking": GuideParking,
    "GuideParkingRequirements": GuideParkingRequirements,
    "GuidePlaygrounds": GuidePlaygrounds,
    "GuideProgramAccess": GuideProgramAccess,
    "GuideRamps": GuideRamps,
    "GuideReachRanges": GuideReachRanges,
    "GuideReasonableModifications": GuideReasonableModifications,
    "GuideRestaurantsRetail": GuideRestaurantsRetail,
    "GuideRestrooms": GuideRestrooms,
    "GuideServiceAnimals": GuideServiceAnimals,
    "GuideSidewalks": GuideSidewalks,
    "GuideSignage": GuideSignage,
    "GuideSmallBusiness": GuideSmallBusiness,
    "GuideSocialMedia": GuideSocialMedia,
    "GuideSwimmingPools": GuideSwimmingPools,
    "GuideTaxIncentives": GuideTaxIncentives,
    "GuideTitleII": GuideTitleII,
    "GuideTurningHandrails": GuideTurningHandrails,
    "GuideVoting": GuideVoting,
    "GuideWcagExplained": GuideWcagExplained,
    "GuideWebFirstSteps": GuideWebFirstSteps,
    "GuideWebRule": GuideWebRule,
    "GuideWebTesting": GuideWebTesting,
    "GuideWhatToExpect": GuideWhatToExpect,
    "GuideWhyAttorney": GuideWhyAttorney,
    "Home": Home,
    "Intake": Intake,
    "LawyerCaseDetail": LawyerCaseDetail,
    "LawyerDashboard": LawyerDashboard,
    "LawyerLanding": LawyerLanding,
    "LawyerProfile": LawyerProfile,
    "LawyerRegister": LawyerRegister,
    "Marketplace": Marketplace,
    "MyCases": MyCases,
    "RightsPathway": RightsPathway,
    "StandardsCh1": StandardsCh1,
    "StandardsCh10": StandardsCh10,
    "StandardsCh2": StandardsCh2,
    "StandardsCh3": StandardsCh3,
    "StandardsCh4": StandardsCh4,
    "StandardsCh5": StandardsCh5,
    "StandardsCh6": StandardsCh6,
    "StandardsCh7": StandardsCh7,
    "StandardsCh8": StandardsCh8,
    "StandardsCh9": StandardsCh9,
    "StandardsGuide": StandardsGuide,
    "TitleIIPathway": TitleIIPathway,
    "TitleIPathway": TitleIPathway,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};