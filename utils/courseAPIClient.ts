import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../generated/graphql';

const ENDPOINT = 'http://localhost:4000';

// GraphQL codegen creates a typed SDK by pulling out all operations in *.graphql files in the project.
// Run `yarn generate:graphql` to regenerate the client, or let `yarn dev` auto regen constantly.
export const gqlClient = getSdk(new GraphQLClient(ENDPOINT));

/*
{
	"results": [{
		"employee": {
			"bigPictureUrl": "",
			"email": "",
			"emails": ["be.lerner@northeastern.edu"],
			"firstName": "Ben",
			"googleScholarId": "",
			"id": "qnCb2rE37jBVGwPZJ%2BmhIg%3D%3D",
			"lastName": "Lerner",
			"link": "",
			"name": "Ben Lerner",
			"officeRoom": "",
			"personalSite": "",
			"phone": "",
			"pic": {},
			"primaryDepartment": "Khoury",
			"primaryRole": "Assistant Teaching Professor",
			"streetAddress": "",
			"url": ""
		},
		"type": "employee"
	}, 
    {
		"class": {
			"classAttributes": ["NU Core Capstone  NCC1", "NUpath Capstone Experience  NCCE", "NU Core Writing Intsv in Majr  NCW2", "NUpath Writing Intensive  NCWI", "Computer&Info Sci  UBCS"],
			"classId": "4410",
			"coreqs": {
				"type": "and",
				"values": []
			},
			"description": "Studies the construction of compilers and integrates material from earlier courses on programming languages, automata theory, computer architecture, and software design. Examines syntax trees; static semantics; type checking; typical machine architectures and their software structures; code generation; lexical analysis; and parsing techniques. Uses a hands-on approach with a substantial term project.",
			"feeAmount": null,
			"feeDescription": "",
			"host": "neu.edu",
			"id": "neu.edu/202130/CS/4410",
			"lastUpdateTime": 1613438523669,
			"maxCredits": 4,
			"minCredits": 4,
			"name": "Compilers",
			"nupath": ["Capstone Experience", "Writing Intensive"],
			"optPrereqsFor": {
				"values": []
			},
			"prereqs": {
				"type": "or",
				"values": [{
					"classId": "4400",
					"subject": "CS"
				}, {
					"classId": "5400",
					"subject": "CS"
				}, {
					"classId": "7400",
					"subject": "CS"
				}]
			},
			"prereqsFor": {
				"values": []
			},
			"prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202130&subj_code_in=CS&crse_numb_in=4410",
			"subject": "CS",
			"termId": "202130",
			"url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202130&subj_in=CS&crse_in=4410&schd_in=%",
			"desc": "Studies the construction of compilers and integrates material from earlier courses on programming languages, automata theory, computer architecture, and software design. Examines syntax trees; static semantics; type checking; typical machine architectures and their software structures; code generation; lexical analysis; and parsing techniques. Uses a hands-on approach with a substantial term project."
		},
		"sections": [{
			"classType": "Lecture",
			"crn": "32685",
			"honors": false,
			"info": "",
			"meetings": [{
				"type": "Class",
				"times": {
					"1": [{
						"end": 59400,
						"start": 53400
					}],
					"3": [{
						"end": 59400,
						"start": 53400
					}]
				},
				"where": "Richards Hall 458",
				"endDate": 18738,
				"startDate": 18646
			}],
			"campus": "Boston",
			"profs": ["Benjamin Lerner"],
			"seatsCapacity": 30,
			"seatsRemaining": 12,
			"url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=202130&crn_in=32685",
			"waitCapacity": 0,
			"waitRemaining": 0,
			"lastUpdateTime": 1613438523669,
			"termId": "202130",
			"host": "neu.edu",
			"subject": "CS",
			"classId": "4410"
		}],
		"type": "class"
	}],
	"filterOptions": {
		"nupath": [{
			"value": "Capstone Experience",
			"count": 3
		}, {
			"value": "Writing Intensive",
			"count": 3
		}, {
			"value": "Analyzing/Using Data",
			"count": 1
		}, {
			"value": "Natural/Designed World",
			"count": 1
		}],
		"subject": [{
			"value": "ENGL",
			"count": 5,
			"description": "English"
		}, {
			"value": "CS",
			"count": 4,
			"description": "Computer Science"
		}],
		"classType": [{
			"value": "Lecture",
			"count": 4
		}, {
			"value": "Individual Instruction",
			"count": 3
		}, {
			"value": "Lab",
			"count": 1
		}, {
			"value": "Seminar",
			"count": 1
		}],
		"campus": [{
			"value": "Boston",
			"count": 5
		}, {
			"value": "No campus, no room needed",
			"count": 3
		}, {
			"value": "Online",
			"count": 2
		}]
	}
}
*/
