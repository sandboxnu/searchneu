import axios from 'axios';
import macros from '../../../components/macros';

export default async function postFeedback(url: string, parsed_data: string) {
  return await axios
    .post(url, parsed_data)
    .then((_) => console.log('Sent response' + parsed_data))
    .catch((error) => {
      macros.error('Unable to submit feedback', error, parsed_data);
      alert(
        `Unable to submit feedback - please submit an issue at https://github.com/sandboxnu/searchneu, and include the following error:\n\n${error}`
      );
    });
}
