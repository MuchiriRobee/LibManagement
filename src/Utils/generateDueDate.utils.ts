import getDate from "./generateDate.utils";


const getDueDate = async (): Promise<string> => {
  const now = new Date();
  now.setDate(now.getDate() + 14); // ⬅️ Add 14 days

  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(7, '0'); // pad to 7 digits

  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${ms}`;
};

export default getDueDate;
