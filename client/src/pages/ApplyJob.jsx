
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Loading from '../components/Loading';
import Navbar from '../components/Navbar';
import { assets } from '../assets/assets';
import kconvert from 'k-convert';
import moment from 'moment';
import JobCard from '../components/JobCard';
import Footer from '../components/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth, useUser } from '@clerk/clerk-react';

const ApplyJob = () => {

    const { id } = useParams();

    const { getToken } = useAuth();
    const { isSignedIn, isLoaded } = useUser();

    const navigate = useNavigate();

    const [JobData, setJobData] = useState(null);
    const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const {
        jobs,
        backendUrl,
        userData,
        userApplications,
        fetchUserApplications,
        isUserLoaded
    } = useContext(AppContext);

    // Fetch Job Details
    const fetchJob = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + `/api/jobs/${id}`
            );

            if (data.success) {
                setJobData(data.job);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message || error.message
            );
        }
    };

    // Apply For Job
    const applyHandler = async () => {

        if (isApplying) return;

        try {

            // Check Clerk Loading
            if (!isLoaded || !isUserLoaded) {
                return toast.info(
                    'Please wait, loading your account...'
                );
            }

            // Check Login
            if (!isSignedIn) {
                return toast.error(
                    'Please login to apply for jobs'
                );
            }

            // Check User Data
            if (!userData) {
                return toast.error(
                    'Unable to load your profile. Please refresh and try again.'
                );
            }

            // Check Resume
            if (!userData.resume) {
                toast.error('Please upload your resume first');
                navigate('/applications');
                return;
            }

            // Check Already Applied
            if (isAlreadyApplied) {
                return toast.info(
                    'You have already applied for this job'
                );
            }

            setIsApplying(true);

            const token = await getToken();

            if (!token) {
                toast.error('Authentication failed. Please login again.');
                return;
            }

            const { data } = await axios.post(
                backendUrl + '/api/users/apply',
                {
                    jobId: JobData._id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success) {
                toast.success(data.message || 'Applied successfully!');

                setIsAlreadyApplied(true);

                await fetchUserApplications();

            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message || error.message
            );

        } finally {
            setIsApplying(false);
        }
    };

    // Check Already Applied
    useEffect(() => {

        if (!JobData || !isSignedIn || !isUserLoaded) {
            setIsAlreadyApplied(false);
            return;
        }

        const hasApplied = userApplications.some(item => {
            const appliedJobId =
                item.jobId?._id || item.jobId;

            return appliedJobId?.toString() ===
                JobData._id.toString();
        });

        setIsAlreadyApplied(hasApplied);

    }, [JobData, userApplications, isSignedIn, isUserLoaded]);

    // Fetch Job
    useEffect(() => {
        fetchJob();
    }, [id]);

    // Loading
    if (!JobData) {
        return <Loading />;
    }

    return (
        <>
            <Navbar />

            <div className='min-h-screen flex flex-col py-10 container px-4 2xl:px-20 mx-auto'>

                <div className='bg-white text-black rounded-lg w-full'>

                    {/* Job Header */}
                    <div className='flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl'>

                        <div className='flex flex-col md:flex-row items-center'>

                            <img
                                className='h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border'
                                src={JobData.companyId?.image}
                                alt=""
                            />

                            <div className='text-center md:text-left text-neutral-700'>

                                <h1 className='text-2xl sm:text-4xl font-medium'>
                                    {JobData.title}
                                </h1>

                                <div className='flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-600 mt-2'>

                                    <span className='flex items-center gap-1'>
                                        <img src={assets.suitcase_icon} alt="" />
                                        {JobData.companyId?.name}
                                    </span>

                                    <span className='flex items-center gap-1'>
                                        <img src={assets.location_icon} alt="" />
                                        {JobData.location}
                                    </span>

                                    <span className='flex items-center gap-1'>
                                        <img src={assets.person_icon} alt="" />
                                        {JobData.level}
                                    </span>

                                    <span className='flex items-center gap-1'>
                                        <img src={assets.money_icon} alt="" />
                                        CTC: {kconvert.convertTo(JobData.salary)}
                                    </span>

                                </div>
                            </div>
                        </div>

                        {/* Apply Button */}
                        <div className='flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center'>

                            <button
                                onClick={applyHandler}
                                disabled={isAlreadyApplied || isApplying}
                                className='bg-blue-600 p-2.5 px-10 text-white rounded disabled:bg-gray-400'
                            >
                                {
                                    isAlreadyApplied
                                        ? 'Already Applied'
                                        : isApplying
                                            ? 'Applying...'
                                            : 'Apply Now'
                                }
                            </button>

                            <p className='mt-1 text-gray-600'>
                                Posted {moment(JobData.date).fromNow()}
                            </p>

                        </div>

                    </div>

                    {/* Job Description */}
                    <div className='flex flex-col lg:flex-row justify-between items-start'>

                        <div className='w-full lg:w-2/3'>

                            <h2 className='font-bold text-2xl mb-4'>
                                Job description
                            </h2>

                            <div
                                className='rich-text'
                                dangerouslySetInnerHTML={{
                                    __html: JobData.description
                                }}
                            />

                            <button
                                onClick={applyHandler}
                                disabled={isAlreadyApplied || isApplying}
                                className='bg-blue-600 p-2.5 px-10 text-white rounded mt-10 disabled:bg-gray-400'
                            >
                                {
                                    isAlreadyApplied
                                        ? 'Already Applied'
                                        : isApplying
                                            ? 'Applying...'
                                            : 'Apply Now'
                                }
                            </button>

                        </div>

                        {/* More Jobs */}
                        <div className='w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5'>

                            <h2>
                                More jobs from {JobData.companyId?.name}
                            </h2>

                            {jobs
                                .filter(job =>
                                    job._id !== JobData._id &&
                                    job.companyId?._id === JobData.companyId?._id
                                )
                                .filter(job => {

                                    const appliedJobsIds = new Set(
                                        userApplications.map(app =>
                                            app.jobId?._id || app.jobId
                                        )
                                    );

                                    return !appliedJobsIds.has(job._id);

                                })
                                .slice(0, 4)
                                .map((job, index) => (
                                    <JobCard key={job._id || index} job={job} />
                                ))
                            }

                        </div>

                    </div>

                </div>

            </div>

            <Footer />
        </>
    );
};

export default ApplyJob;
