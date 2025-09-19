import data from './log.json';

type Change = {
    contributors: String[]
    description: String
}

type LogEntry = {
    version: String
    title: String
    date: String
    changes: Change[]
    notes: String
}


function whatever() {
    const changes = data.changes

    return (
        <>
            <h1>Changelog</h1>
            {
                changes.map((entry: LogEntry) => {
                    return (
                        <>
                            <br />
                            <h2>{entry.date + " | " + entry.version}</h2>
                            <h1>{entry.title}</h1>
                            {
                                entry.changes.map((change: Change) => {
                                    return <li>
                                            <>
                                                <p>{change.description}</p>
                                                <p>{change.contributors.map((contributor: String) => {
                                                        const username = contributor.split("/").at(-1)
                                                        return <a href={String(contributor)}>{username} </a>
                                                    })}</p>
                                            </>
                                        </li>
                                })
                            }
                            <h3>Additional Notes: {entry.notes}</h3>
                        </>
                    )
                })
            }
        </>
    )
}

export default whatever