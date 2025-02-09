interface ContentProps {
  title: string;
}

export function Content(props: ContentProps) {
  return (
    <div className="flex flex-wrap">
      <div className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-8/12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between text-black">
          <p className="text-2xl font-bold">
            {props.title || "Healthcare & Food Management"}
          </p>
          <p className="">{new Date().toLocaleDateString("en-US")}</p>
        </div>

        {/* Main Statistics */}
        <div className="flex flex-wrap items-center justify-between pb-8">
          <div className="flex flex-wrap text-black">
            <div className="pr-10">
              <div className="text-2xl font-bold">120</div>
              <div className="">Patients under treatment</div>
            </div>
            <div className="pr-10">
              <div className="text-2xl font-bold">350</div>
              <div className="">Meals served today</div>
            </div>
            <div className="pr-10">
              <div className="text-2xl font-bold">75</div>
              <div className="">Menu items</div>
            </div>
            <div>
              <div className="text-2xl font-bold">20</div>
              <div className="">Staff on duty</div>
            </div>
          </div>
        </div>

        {/* Management List */}
        <div className="flex flex-wrap">
          {/* Medical Examination */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-blue-700">
                  In Progress
                </span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">
                  Medical Schedule
                </p>
                <p className="mt-2 text-sm opacity-70">Patients: 45</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Progress</p>
                <p className="text-sm font-bold">60%</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-6/12 bg-blue-700 rounded-md"></span>
              </div>
            </div>
          </div>

          {/* Meal Management */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-yellow-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-yellow-700">Ready</span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">Meal Service</p>
                <p className="mt-2 text-sm opacity-70">Portions: 350</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Progress</p>
                <p className="text-sm font-bold">80%</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-8/12 bg-yellow-700 rounded-md"></span>
              </div>
            </div>
          </div>

          {/* Food Inventory */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-green-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-green-700">
                  Checking
                </span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">Food Inventory</p>
                <p className="mt-2 text-sm opacity-70">Stock: 75 items</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Progress</p>
                <p className="text-sm font-bold">50%</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-5/12 bg-green-700 rounded-md"></span>
              </div>
            </div>
          </div>

          {/* Staff Management */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-purple-700">
                  On Duty
                </span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">Staff on Shift</p>
                <p className="mt-2 text-sm opacity-70">Count: 20</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Progress</p>
                <p className="text-sm font-bold">100%</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-full bg-purple-700 rounded-md"></span>
              </div>
            </div>
          </div>

          {/* Medical Incidents */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-red-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-red-700">
                  Emergency
                </span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">
                  Medical Incidents
                </p>
                <p className="mt-2 text-sm opacity-70">Cases: 3</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Severity</p>
                <p className="text-sm font-bold">High</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-9/12 bg-red-700 rounded-md"></span>
              </div>
            </div>
          </div>

          {/* Vaccination */}
          <div className="w-full md:w-4/12 p-2">
            <div className="rounded-3xl p-4 bg-cyan-100">
              <div className="flex items-center justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-bold text-cyan-700">
                  Completed
                </span>
              </div>
              <div className="mt-5 text-center">
                <p className="text-base font-bold opacity-70">Vaccination</p>
                <p className="mt-2 text-sm opacity-70">Cases: 50</p>
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-sm font-bold">Progress</p>
                <p className="text-sm font-bold">90%</p>
              </div>
              <div className="h-1 w-full bg-white rounded-md overflow-hidden">
                <span className="block h-1 w-9/12 bg-cyan-700 rounded-md"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 w-full lg:mt-0 lg:w-4/12 lg:pl-4">
        <div className="rounded-3xl bg-white px-6 pt-6 shadow-lg">
          <div className="flex pb-6 text-2xl font-bold text-gray-800">
            <p>Health Notifications</p>
          </div>
          <div>
            <div className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80"
                alt="profile image"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="w-full pl-4">
                <div className="flex w-full items-center justify-between">
                  <div className="font-medium text-gray-800">Nurse Sarah</div>
                  <div className="flex h-7 w-7 cursor-pointer items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <p className="my-2 text-sm text-gray-600">
                  New health screening schedule has been posted for this month.
                  Please check and confirm. 🏥
                </p>
                <p className="text-right text-sm text-gray-500">Dec, 12</p>
              </div>
            </div>
            <div className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start">
              <img
                src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2550&q=80"
                alt="profile image2"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="w-full pl-4">
                <div className="flex w-full items-center justify-between">
                  <div className="font-medium text-gray-800">Canteen Manager</div>
                  <div className="flex h-7 w-7 cursor-pointer items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <p className="my-2 text-sm text-gray-600">
                  Weekly food safety inspection completed. All standards met
                  successfully.
                </p>
                <p className="text-right text-sm text-gray-500">Dec, 12</p>
              </div>
            </div>
            <div className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start">
              <img
                src="https://images.unsplash.com/photo-1543965170-4c01a586684e?ixid=MXwxMjA3fDB8MHxzZWFyY2h8NDZ8fG1hbnxlbnwwfDB8MHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60"
                alt="profile image"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="w-full pl-4">
                <div className="flex w-full items-center justify-between">
                  <div className="font-medium text-gray-800">Dr. Johnson</div>
                  <div className="flex h-7 w-7 cursor-pointer items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <p className="my-2 text-sm text-gray-600">
                  Reminder: Vaccination campaign starts next week. Please
                  prepare necessary arrangements.
                </p>
                <p className="text-right text-sm text-gray-500">Dec, 12</p>
              </div>
            </div>
            <div className="flex w-full border-t border-gray-200 p-4 hover:bg-gray-100 2xl:items-start">
              <img
                src="https://images.unsplash.com/photo-1533993192821-2cce3a8267d1?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MTl8fHdvbWFuJTIwbW9kZXJufGVufDB8fDB8&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60"
                alt="profile image3"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="w-full pl-4">
                <div className="flex w-full items-center justify-between">
                  <div className="font-medium text-gray-800">
                    Nutritionist Lisa
                  </div>
                  <div className="flex h-7 w-7 cursor-pointer items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <p className="my-2 text-sm text-gray-600">
                  New healthy menu options added for next month. Student
                  feedback has been positive.
                </p>
                <p className="text-right text-sm text-gray-500">Dec, 12</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
