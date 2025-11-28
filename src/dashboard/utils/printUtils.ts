import { PatientSubmission } from '../types';

export const printPatientDetails = (patient: PatientSubmission, signatureUrl?: string | null) => {
    const formatToGermanDate = (dateString: string) => {
        if (!dateString) return "Ungültiges Datum";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Ungültiges Datum";

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    };

    const renderAvailabilityGrid = () => {
        // Check if the patient selected the flexibility option
        const isFlexible = patient.submissions.form_field_ab01;

        const days = [
            { name: 'Montag', data: patient.submissions.montag || [] },
            { name: 'Dienstag', data: patient.submissions.dienstag || [] },
            { name: 'Mittwoch', data: patient.submissions.mittwoch || [] },
            { name: 'Donnerstag', data: patient.submissions.donnerstag || [] },
            { name: 'Freitag', data: patient.submissions.freitag || [] }
        ];

        const timeSlots = ['08-09', '09-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19'];

        let tableHTML = `
            <table style="
                width: 100%;
                border-collapse: collapse;
                fontSize: 14px;
                border: 1px solid #ddd;
                margin: 20px 0;
            ">
                <thead>
                    <tr>
                        <th style="
                            padding: 8px;
                            border: 1px solid #ddd;
                            background-color: #f8f9fa;
                            font-weight: bold;
                            text-align: center;
                            font-size: 12px;
                        ">
                            Tag/Zeit
                        </th>
        `;

        // Add time slot headers
        timeSlots.forEach(slot => {
            tableHTML += `
                <th style="
                    padding: 6px 4px;
                    border: 1px solid #ddd;
                    background-color: #f8f9fa;
                    font-weight: bold;
                    text-align: center;
                    font-size: 12px;
                ">
                    ${slot}
                </th>
            `;
        });

        tableHTML += `
                    </tr>
                </thead>
                <tbody>
        `;

        // Add day rows
        days.forEach(day => {
            tableHTML += `
                <tr>
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                        background-color: #f8f9fa;
                        font-weight: bold;
                        font-size: 12px;
                        white-space: nowrap;
                    ">
                        ${day.name}
                    </td>
            `;

            timeSlots.forEach(timeSlot => {
                // If flexible, show X for all slots, otherwise check individual day data
                let isAvailable = false;
                if (isFlexible) {
                    isAvailable = true;
                } else {
                    // Convert time slot format to match stored format (8-9 instead of 08-09)
                    const convertedTimeSlot = timeSlot.replace(/^0/, '').replace(/-0/, '-');
                    isAvailable = day.data.some(slot =>
                        slot.includes(timeSlot) ||
                        slot.includes(convertedTimeSlot) ||
                        slot === timeSlot ||
                        slot === convertedTimeSlot
                    );
                }
                tableHTML += `
                    <td style="
                        padding: 8px;
                        border: 1px solid #ddd;
                        background-color: white;
                        text-align: center;
                        font-size: 12px;
                    ">
                        ${isAvailable ? 'X' : ''}
                    </td>
                `;
            });

            tableHTML += `</tr>`;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Patientendetails - ${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}</title>
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    background-color: #f0f0f0;
                }
                
                .print-container {
                    width: 210mm;
                    min-height: 297mm;
                    background-color: white;
                    padding: 20px 40px;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                
                .header-image {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .header-image img {
                    width: 400px;
                    height: auto;
                    max-width: 100%;
                }
                
                .title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    margin-top: 20px;
                    font-size: 12px;
                }
                
                .info-table td {
                    padding: 6px;
                    border: 1px solid #ddd;
                }
                
                .info-table .label {
                    font-weight: bold;
                    background-color: #f8f9fa;
                    width: 25%;
                }
                
                .info-table .label-small {
                    font-weight: bold;
                    background-color: #f8f9fa;
                }
                
                .info-table .tall-cell {
                    min-height: 60px;
                    vertical-align: top;
                }
                
                .availability-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                
                .signature-cell {
                    text-align: center;
                }
                
                .signature-cell img {
                    max-width: 100px;
                    max-height: 50px;
                }
                
                @media print {
                    body {
                        background-color: white;
                        margin: 0;
                        padding: 0;
                    }

                    .print-container {
                        margin: 0;
                        padding: 15px 30px;
                        box-shadow: none;
                    }

                    @page {
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <!-- Header Image -->
                <div class="header-image">
                    <img src="https://static.wixstatic.com/media/061196_bcdbd8aeed994cc29b8850c78bd7c14e~mv2.jpg" alt="Header">
                </div>

                <!-- Title -->
                <div class="title">Anmeldung</div>

                <!-- Patient Information Table -->
                <table class="info-table">
                    <tbody>
                        <tr>
                            <td class="label">Name, Vorname</td>
                            <td colspan="3">${`${patient.submissions.name_1 || ''} ${patient.submissions.vorname || ''}`.trim()}</td>
                        </tr>
                        <tr>
                            <td class="label">Geschlecht</td>
                            <td>${patient.submissions.geschlecht || ''}</td>
                            <td class="label-small">Geburtsdatum</td>
                            <td>${patient.submissions.geburtsdatum
            ? formatToGermanDate(patient.submissions.geburtsdatum)
            : 'Kein Geburtsdatum'
        }</td>
                        </tr>
                        <tr>
                            <td class="label">Adresse</td>
                            <td colspan="3">${patient.submissions.address_51bd || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Telefon</td>
                            <td>${patient.submissions.telefon || ''}</td>
                            <td class="label-small">AB/Mailbox aktiv?</td>
                            <td>${patient.submissions.ab_mailbox_activ || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Email</td>
                            <td colspan="3">${patient.submissions.email_726a || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Name der anmeldenden Person</td>
                            <td>${patient.submissions.name_der_anmeldenden_person || ''}</td>
                            <td class="label-small">Verhältnis</td>
                            <td>${patient.submissions.verhaeltnis || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Hausbesuch verordnet?</td>
                            <td>${patient.submissions.wurde_ein_hausbesuch_verordnet || ''}</td>
                            <td class="label-small">Zuzahlungsbefreit?</td>
                            <td>${patient.submissions.bei_volljaehrigen_patienten_zuzahlungsbefreit || ''}</td>
                        </tr>
                        <tr>
                            <td class="label tall-cell">Diagnose oder Grund Ihrer Anmeldung</td>
                            <td class="tall-cell" colspan="3">${patient.submissions.diagnose_oder_grund_ihrer_anmeldung || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Verordnende/r Ärztin/Arzt</td>
                            <td>${patient.submissions.verordnende_r_aerztin_arzt || ''}</td>
                            <td class="label-small">Krankenkasse</td>
                            <td>${patient.submissions.krankenkasse || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Schon einmal bei uns in Behandlung?</td>
                            <td colspan="3">${patient.submissions.waren_sie_schon_einmal_bei_uns_in_behandlung || ''}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Availability Section -->
                <div class="availability-title">Verfügbarkeit</div>
                ${renderAvailabilityGrid()}

                <!-- Additional Information -->
                <table class="info-table">
                    <tbody>
                        <tr>
                            <td class="label">Kurzfristige Termine</td>
                            <td colspan="3">${patient.submissions.wuerden_sie_auch_kurzfristige_termine_wahrnehmen_koennen_wenn_z || ''}</td>
                        </tr>
                        <tr>
                            <td class="label tall-cell">Etwas Wichtiges?</td>
                            <td class="tall-cell" colspan="3">${patient.submissions.noch_etwas_wichtiges || ''}</td>
                        </tr>
                        <tr>
                            <td class="label">Datum</td>
                            <td>${formatToGermanDate(patient.submissions.date_5bd8 || patient._createdDate)}</td>
                            <td class="label-small">Unterschrift</td>
                            <td class="signature-cell">
                                ${signatureUrl ? `<img src="${signatureUrl}" alt="Unterschrift">` : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;

    // Open new window with the content
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for images to load before printing
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    } else {
        console.error('Could not open print window. Please check if popups are blocked.');
    }
};

export default printPatientDetails;