## Task
Design and implement a RESTful API for managing a list of users with customizable properties and sending emails to the users.
## To be solved 
Runs only on Local System because i am using fs readStream
## Approach
The approach employs streaming to manage memory efficiently, while ensuring email uniqueness through in-memory caching using Sets.
Implementation includes bulk methods like InsertMany for faster processing. The codebase also incorporates error handling mechanisms and fallback strategies for resilience. Additionally, the system is designed to facilitate email delivery to users, with consideration for scalability and user preferences, such as email subscription status.
User can unsbscribe for mailing services whenever he wants
