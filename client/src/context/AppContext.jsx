import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const [searchFilter, setSearchFilter] = useState({
        title: "",
        location: ""
    });

    const [isSearched, setIsSearched] = useState(false);
    const [jobs, setJobs] = useState([]);

    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

    const [companyToken, setCompanyToken] = useState(null);
    const [companyData, setCompanyData] = useState(null);

    const [userData, setUserData] = useState(null);
    const [userApplications, setUserApplications] = useState([]);

    const [isUserLoaded, setIsUserLoaded] = useState(false);

    // Fetch all jobs
    const fetchJobs = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/jobs`
            );

            if (data.success) {
                setJobs(data.jobs);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Fetch Jobs Error:", error);
        }
    };

    // Fetch company data
    const fetchCompanyData = async (token) => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/company/company`,
                {
                    headers: {
                        token
                    }
                }
            );

            if (data.success) {
                setCompanyData(data.company);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Company Error:", error);
        }
    };

    // Register user in MongoDB
    const registerUser = async () => {
        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Clerk token is missing");
            }

            console.log("Clerk token exists:", !!token);

            const userDetails = {
                name: user.fullName || user.firstName || "User",
                email: user.primaryEmailAddress?.emailAddress,
                image: user.imageUrl || ""
            };

            const response = await axios.post(
                `${backendUrl}/api/users/register`,
                userDetails,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            return response.data.user;

        } catch (error) {
            console.error(
                "Register Error:",
                error.response?.data || error.message
            );

            throw error;
        }
    };

    // Fetch user data
    const fetchUserData = async () => {
        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const { data } = await axios.get(
                `${backendUrl}/api/users/user`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success) {
                setUserData(data.user);
                return data.user;
            }

            return null;

        } catch (error) {
            console.error("User Data Error:", error);
            return null;
        }
    };

    // Fetch user applications
    const fetchUserApplications = async () => {
        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const { data } = await axios.get(
                `${backendUrl}/api/users/applications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success) {
                setUserApplications(data.applications);
                return data.applications;
            }

            return [];

        } catch (error) {
            console.error("Applications Error:", error);
            return [];
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchJobs();

        const storedCompanyToken =
            localStorage.getItem("companyToken");

        if (storedCompanyToken) {
            setCompanyToken(storedCompanyToken);
        }
    }, []);

    // Fetch company data
    useEffect(() => {
        if (companyToken) {
            fetchCompanyData(companyToken);
        } else {
            setCompanyData(null);
        }
    }, [companyToken]);

    // Clerk authentication and MongoDB synchronization
    useEffect(() => {
        let cancelled = false;

        const syncUser = async () => {
            if (!isLoaded) return;

            if (!user) {
                setUserData(null);
                setUserApplications([]);
                setIsUserLoaded(true);
                return;
            }

            setIsUserLoaded(false);

            try {
                // Get Clerk authentication token
                const token = await getToken();

                if (!token) {
                    throw new Error("Clerk authentication token not found");
                }

                // Register user in MongoDB
                const registeredUser = await registerUser(token);

                if (cancelled) return;

                setUserData(registeredUser);

                // Fetch applications
                const { data } = await axios.get(
                    `${backendUrl}/api/users/applications`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (cancelled) return;

                if (data.success) {
                    setUserApplications(data.applications);
                } else {
                    setUserApplications([]);
                    console.error(data.message);
                }

                console.log("User Sync Completed Successfully");

            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "User Sync Error:",
                        error.response?.data || error.message
                    );

                    toast.error(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to synchronize user"
                    );

                    setUserData(null);
                    setUserApplications([]);
                }
            } finally {
                if (!cancelled) {
                    setIsUserLoaded(true);
                }
            }
        };

        syncUser();

        return () => {
            cancelled = true;
        };

    }, [isLoaded, user?.id]);

    const value = {
        setSearchFilter,
        searchFilter,

        isSearched,
        setIsSearched,

        jobs,
        setJobs,

        showRecruiterLogin,
        setShowRecruiterLogin,

        companyToken,
        setCompanyToken,

        companyData,
        setCompanyData,

        backendUrl,

        userData,
        setUserData,

        userApplications,
        setUserApplications,

        fetchUserData,
        fetchUserApplications,

        isUserLoaded
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};